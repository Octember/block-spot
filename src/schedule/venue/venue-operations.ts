import { AvailabilityRule, Space, Venue } from "wasp/entities";
import { HttpError } from "wasp/server";
import { GetVenueDetails, UpdateSpacePriority } from "wasp/server/operations";

type GetVenueDetailsPayload = {
  venueId: string;
};

export const getVenueDetails: GetVenueDetails<
  GetVenueDetailsPayload,
  | (Venue & {
      availabilityRules: AvailabilityRule[];
      spaces: Space[];
    })
  | null
> = async (args, context) => {
  const venue = await context.entities.Venue.findFirst({
    where: { id: args.venueId },
    include: {
      availabilityRules: true,
      spaces: {
        orderBy: {
          priority: "asc",
        },
      },
    },
  });

  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

  return venue;
};

type UpdateSpacePriorityPayload = {
  spaceUpdates: { id: string; priority: number }[];
};

export const updateSpacePriority: UpdateSpacePriority<
  UpdateSpacePriorityPayload,
  { success: boolean }
> = async (args, context) => {
  const user = await context.entities.User.findUnique({
    where: {
      id: context.user?.id,
    },
    include: {
      organizations: {
        include: {
          organization: true,
        },
      },
    },
  });

  const organizationUser = user?.organizations.pop();

  if (!user || !organizationUser || organizationUser.role !== "OWNER") {
    throw new HttpError(401, "User is not an owner of the organization");
  }

  try {
    await Promise.all(
      args.spaceUpdates.map((update) =>
        context.entities.Space.update({
          where: { id: update.id },
          data: { priority: update.priority },
        })
      )
    );
    return { success: true };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    console.error(error);

    throw new HttpError(500, "Failed to update space priorities: " + error);
  }
};
