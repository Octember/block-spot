import { addDays, isValid, startOfDay, startOfToday } from "date-fns";
import { AvailabilityRule, Reservation, Space, Venue } from "wasp/entities";
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
  UpdateReservation,
  UpdateVenue,
  UpdateVenueAvailability,
  UpdateSpace,
} from "wasp/server/operations";

type GetVenueInfoPayload = {
  venueId: string;
  selectedDate: Date;
};

export const getAllVenues: GetAllVenues<
  void,
  (Venue & { spaces: Space[] })[]
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.Venue.findMany({
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
  if (!context.user) {
    throw new HttpError(401);
  }

  const date = isValid(args.selectedDate)
    ? startOfDay(args.selectedDate)
    : startOfToday();

  return context.entities.Venue.findFirst({
    where: {
      id: args.venueId,
    },
    include: {
      availabilityRules: true,
      spaces: {
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
  "spaceId" | "startTime" | "endTime" | "description"
>;

export const createReservation: CreateReservation<
  CreateReservationPayload,
  Reservation
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const endTime = new Date(args.endTime);
  endTime.setSeconds(0, 0);
  const startTime = new Date(args.startTime);
  startTime.setSeconds(0, 0);

  return context.entities.Reservation.create({
    data: {
      spaceId: args.spaceId,
      startTime: startTime,
      endTime: endTime,
      userId: context.user.id,
      status: "CONFIRMED",
      description: args.description,
    },
  });
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
    Pick<Reservation, "description" | "startTime" | "endTime" | "spaceId">
  >;

export const updateReservation: UpdateReservation<
  UpdateReservationPayload,
  Reservation
> = async (args, context) => {
  return context.entities.Reservation.update({
    where: { id: args.id },
    data: {
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      spaceId: args.spaceId,
    },
  });
};

type CreateVenuePayload = Pick<Venue, "name">;

export const createVenue: CreateVenue<CreateVenuePayload, Venue> = async (
  args,
  context,
) => {
  return context.entities.Venue.create({
    data: {
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
  (Venue & { spaces: Space[]; availabilityRules: AvailabilityRule[] }) | null
> = async (args, context) => {
  return context.entities.Venue.findFirst({
    where: { id: args.venueId },
    include: {
      spaces: true,
      availabilityRules: true,
    },
  });
};

type UpdateVenuePayload = Pick<
  Venue,
  "id" | "name" | "displayStart" | "displayEnd"
> & { spaces: Pick<Space, "id" | "name">[] };

export const updateVenue: UpdateVenue<UpdateVenuePayload, Venue> = async (
  args,
  context,
) => {
  console.log("updateVenue", args);
  return context.entities.Venue.update({
    where: { id: args.id },
    data: {
      name: args.name,
      displayStart: Number(args.displayStart),
      displayEnd: Number(args.displayEnd),
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
    throw new HttpError(401);
  }

  // Verify venue exists and user has access
  const venue = await context.entities.Venue.findFirst({
    where: { id: args.venueId },
  });

  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

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

export const deleteSpace: DeleteSpace<DeleteSpacePayload, Space> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

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

export const updateSpace: UpdateSpace<UpdateSpacePayload, Space> = async (args, context) => {
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
