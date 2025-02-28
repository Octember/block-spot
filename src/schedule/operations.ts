import { addDays, isValid } from "date-fns";
import {
  AvailabilityRule,
  Reservation,
  Space,
  User,
  Venue
} from "wasp/entities";
import { HttpError } from "wasp/server";
import {
  CreateReservation,
  CreateSpace,
  CreateSpaces,
  CreateVenue,
  DeleteReservation,
  DeleteSpace,
  GetAllVenues,
  GetVenueById,
  GetVenueInfo,
  GetVenueSchedule,
  UpdateReservation,
  UpdateSpace,
  UpdateVenue,
  UpdateVenueAvailability,
} from "wasp/server/operations";
import { getStartOfDay, localToUTC } from "./calendar/date-utils";
import { getStartEndTime, runPaymentRules } from "./operations/new-reservations";

type GetVenueSchedulePayload = {
  venueId: string;
  selectedDate: Date;
};

export const getVenueSchedule: GetVenueSchedule<
  GetVenueSchedulePayload,
  (Space & { reservations: (Reservation & { user: User })[] })[]
> = async (args, context) => {
  return context.entities.Space.findMany({
    where: {
      venueId: args.venueId,
    },
    include: {
      reservations: {
        where: {
          startTime: {
            gte: args.selectedDate,
            lt: addDays(args.selectedDate, 1),
          },
        },
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      priority: "asc",
    },
  });
};

type GetVenueInfoPayload = {
  venueId: string;
  selectedDate: Date;
};

export const getAllVenues: GetAllVenues<
  void,
  (Venue & { spaces: Space[] })[]
> = async (args, context) => {
  if (!context.user) {
    console.log(`[VENUES] Unauthorized access attempt to getAllVenues`);
    throw new HttpError(401);
  }

  const userOrgs = await context.entities.User.findFirst({
    where: {
      id: context.user.id,
    },
    include: {
      organizations: true,
    },
  });

  // TODO: middleware to check if user belongs to an organization and current current org
  const organizationId = userOrgs?.organizations.pop()?.organizationId;

  if (!organizationId) {
    console.log(`[VENUES] User ${context.user.id} does not belong to any organization`);
    throw new HttpError(500, "User does not belong to an organization");
  }

  console.log(`[VENUES] Fetching venues for organization ${organizationId}`);

  return context.entities.Venue.findMany({
    where: {
      organization: {
        id: organizationId,
      },
    },
    include: {
      spaces: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getVenueInfo: GetVenueInfo<
  GetVenueInfoPayload,
  | (Venue & { spaces: (Space & { reservations: Reservation[] })[] } & {
      availabilityRules: AvailabilityRule[];
    })
  | null
> = async (args, context) => {
  const venue = await context.entities.Venue.findFirst({
    where: { id: args.venueId },
  });

  if (!venue) {
    console.log(`[VENUES] Venue not found: ${args.venueId}`);
    throw new HttpError(404, "Venue not found");
  }

  console.log(`[VENUES] Fetching info for venue ${args.venueId}`);

  const date = isValid(args.selectedDate)
    ? getStartOfDay(args.selectedDate, venue)
    : getStartOfDay(new Date(), venue);

  return context.entities.Venue.findFirst({
    where: {
      id: args.venueId,
    },
    include: {
      availabilityRules: true,
      spaces: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          reservations: {
            where: {
              startTime: {
                gte: date,
                lt: addDays(date, 1),
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

type CreateReservationPayload = Pick<
  Reservation,
  "spaceId" | "startTime" | "endTime"
> &
  Partial<Pick<Reservation, "userId" | "description">>;

export const createReservation: CreateReservation<
  CreateReservationPayload,
  Reservation
> = async (args, context) => {
  if (!context.user) {
    console.log(`[SCHEDULE] Unauthorized attempt to create reservation for space ${args.spaceId}`);
    throw new HttpError(401);
  }

  const space = await context.entities.Space.findUnique({
    where: { id: args.spaceId },
    include: {
      reservations: true,
      venue: {
        include: {
          paymentRules: true,
        },
      },
    },
  });

  if (!space) {
    console.log(`[SCHEDULE] Space not found: ${args.spaceId}`);
    throw new HttpError(404, "Space not found");
  }

  const { startTime, endTime } = getStartEndTime(
    args.startTime,
    args.endTime,
    space?.venue,
  );

  // Check if time slot is available
  const isSlotTaken = space.reservations.some(
    (r) => r.startTime < endTime && r.endTime > startTime,
  );
  if (isSlotTaken) {
    console.log(`[SCHEDULE] Time slot conflict for space ${args.spaceId}: ${startTime} - ${endTime}`);
    throw new HttpError(400, "Time slot is already booked");
  }

  // Check if payment is required
  const { requiresPayment, totalCost } = runPaymentRules(
    space.venue.paymentRules,
    startTime,
    endTime,
    space.id,
  );

  console.log(`[SCHEDULE] Creating reservation with payment required: ${requiresPayment}`);

  const reservation = await context.entities.Reservation.create({
    data: {
      userId: args.userId || context.user.id,
      spaceId: args.spaceId,
      startTime,
      endTime,
      status: requiresPayment ? "PENDING" : "CONFIRMED",
      description: args.description,
    },
  });
  console.log(`[SCHEDULE] Total cost: ${totalCost}, reservation: ${reservation.id}`);

  return reservation;
};

type DeleteReservationPayload = Pick<Reservation, "id">;

export const deleteReservation: DeleteReservation<
  DeleteReservationPayload,
  Reservation
> = async (args, context) => {
  return context.entities.Reservation.delete({
    where: { id: args.id },
  });
};

type UpdateReservationPayload = Pick<Reservation, "id"> &
  Partial<
    Pick<
      Reservation,
      "description" | "startTime" | "endTime" | "spaceId" | "userId"
    >
  >;

export const updateReservation: UpdateReservation<
  UpdateReservationPayload,
  Reservation
> = async (args, context) => {
  console.log(`[SCHEDULE] Updating reservation ${args.id}`);
  
  const venue = await context.entities.Venue.findFirst({
    where: {
      spaces: {
        some: {
          id: args.spaceId || "",
        },
      },
    },
  });

  if (!venue) {
    console.log(`[SCHEDULE] Venue not found for space ${args.spaceId}`);
    throw new HttpError(404, "Venue not found");
  }

  // Convert times to UTC for storage if they are provided
  const updates: Partial<
    Pick<
      Reservation,
      "description" | "startTime" | "endTime" | "spaceId" | "userId"
    >
  > = {
    description: args.description,
    spaceId: args.spaceId,
    userId: args.userId,
  };

  let startTime: Date | undefined;
  let endTime: Date | undefined;

  if (args.startTime) {
    startTime = localToUTC(new Date(args.startTime), venue);
    startTime.setSeconds(0, 0);
    updates.startTime = startTime;
  }

  if (args.endTime) {
    endTime = localToUTC(new Date(args.endTime), venue);
    endTime.setSeconds(0, 0);
    updates.endTime = endTime;
  }

  // Validate times if both are provided
  if (startTime && endTime && startTime >= endTime) {
    throw new HttpError(400, "Start time must be before end time");
  }

  return context.entities.Reservation.update({
    where: { id: args.id },
    data: updates,
  });
};

type CreateVenuePayload = Pick<Venue, "name">;

export const createVenue: CreateVenue<CreateVenuePayload, Venue> = async (
  args,
  context,
) => {
  if (!context.user) {
    console.log(`[VENUES] Unauthorized attempt to create venue`);
    throw new HttpError(401);
  }

  const userOrgs = await context.entities.User.findFirst({
    where: {
      id: context.user.id,
    },
    include: {
      organizations: true,
    },
  });

  const organizationId = userOrgs?.organizations.pop()?.organizationId;

  if (!organizationId) {
    console.log(`[VENUES] User ${context.user.id} does not belong to an organization`);
    throw new HttpError(401, "User does not belong to an organization");
  }

  console.log(`[VENUES] Creating new venue "${args.name}" for organization ${organizationId}`);

  return context.entities.Venue.create({
    data: {
      organizationId,
      name: args.name,
      address: "",
      availabilityRules: {
        create: [
          {
            days: [],
            startTimeMinutes: 480,
            endTimeMinutes: 1080,
          },
        ],
      },
    },
  });
};

type GetVenueByIdPayload = {
  venueId: string;
};

export const getVenueById: GetVenueById<
  GetVenueByIdPayload,
  | (Venue & {
      spaces: Space[];
      availabilityRules: AvailabilityRule[];
    })
  | null
> = async (args, context) => {
  const venue = await context.entities.Venue.findFirst({
    where: { id: args.venueId },
    include: {
      spaces: true,
      availabilityRules: true,
    },
  });

  return venue;
};

type UpdateVenuePayload = Pick<
  Venue,
  | "id"
  | "name"
  | "displayStart"
  | "displayEnd"
  | "announcements"
  | "contactEmail"
  | "timeZoneId"
> & { spaces: Pick<Space, "id" | "name">[] };

export const updateVenue: UpdateVenue<UpdateVenuePayload, Venue> = async (
  args,
  context,
) => {
  console.log(`[VENUES] Updating venue ${args.id}`);

  return context.entities.Venue.update({
    where: { id: args.id },
    data: {
      name: args.name,
      displayStart: Number(args.displayStart),
      displayEnd: Number(args.displayEnd),
      announcements: args.announcements,
      contactEmail: args.contactEmail,
      timeZoneId: args.timeZoneId,
      spaces: {
        deleteMany: {
          NOT: args.spaces
            .filter((space) => Boolean(space.id))
            .map((space) => ({ id: space.id || "" })),
        },

        upsert: args.spaces.map((space) => ({
          where: { id: space.id || "" },

          update: { name: space.name },

          create: { name: space.name, type: "ROOM", capacity: 1 },
        })),
      },
    },
  });
};

type UpdateVenueAvailabilityPayload = Pick<Venue, "id"> & {
  availabilityRules: Pick<
    AvailabilityRule,
    "startTimeMinutes" | "endTimeMinutes" | "days"
  >[];
};

export const updateVenueAvailability: UpdateVenueAvailability<
  UpdateVenueAvailabilityPayload,
  Venue
> = async (args, context) => {
  return context.entities.Venue.update({
    where: { id: args.id },
    data: {
      availabilityRules: {
        deleteMany: {},
        create: args.availabilityRules.map((rule) => ({
          days: [],
          startTimeMinutes: rule.startTimeMinutes,
          endTimeMinutes: rule.endTimeMinutes,
        })),
      },
    },
  });
};

type CreateSpacePayload = {
  venueId: string;
  name: string;
  capacity: number;
  type?: string;
};

export const createSpace: CreateSpace<CreateSpacePayload, Space> = async (
  args,
  context,
) => {
  if (!context.user) {
    console.log(`[SPACES] Unauthorized attempt to create space in venue ${args.venueId}`);
    throw new HttpError(401);
  }

  // Verify venue exists and user has access
  const venue = await context.entities.Venue.findFirst({
    where: { id: args.venueId },
  });

  if (!venue) {
    console.log(`[SPACES] Venue not found: ${args.venueId}`);
    throw new HttpError(404, "Venue not found");
  }

  console.log(`[SPACES] Creating new space "${args.name}" in venue ${args.venueId}`);

  return context.entities.Space.create({
    data: {
      name: args.name,
      venueId: args.venueId,
      capacity: args.capacity,
      type: args.type || "ROOM", // Default type
    },
  });
};

type CreateSpacesPayload = {
  venueId: string;
  spaces: {
    name: string;
    capacity: number;
    type?: string;
  }[];
};

export const createSpaces: CreateSpaces<CreateSpacesPayload, Space[]> = async (
  args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Verify venue exists and user has access
  const venue = await context.entities.Venue.findFirst({
    where: { id: args.venueId },
  });

  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

  // Create all spaces in a single database operation
  await context.entities.Space.createMany({
    data: args.spaces.map((space) => ({
      name: space.name,
      venueId: args.venueId,
      capacity: space.capacity,
      type: space.type || "ROOM", // Default type
    })),
  });

  // Fetch and return the created spaces
  return context.entities.Space.findMany({
    where: {
      venueId: args.venueId,
      name: {
        in: args.spaces.map((space) => space.name),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: args.spaces.length,
  });
};

type DeleteSpacePayload = {
  spaceId: string;
};

export const deleteSpace: DeleteSpace<DeleteSpacePayload, Space> = async (
  args,
  context,
) => {
  if (!context.user) {
    console.log(`[SPACES] Unauthorized attempt to delete space ${args.spaceId}`);
    throw new HttpError(401);
  }

  console.log(`[SPACES] Deleting space ${args.spaceId}`);

  return context.entities.Space.delete({
    where: { id: args.spaceId },
  });
};

type UpdateSpacePayload = {
  spaceId: string;
  name: string;
  capacity: number;
  type?: string;
};

export const updateSpace: UpdateSpace<UpdateSpacePayload, Space> = async (
  args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.Space.update({
    where: { id: args.spaceId },
    data: {
      name: args.name,
      capacity: args.capacity,
      type: args.type,
    },
  });
};
