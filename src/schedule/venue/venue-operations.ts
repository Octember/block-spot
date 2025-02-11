import { AvailabilityRule, Space, Venue } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { GetVenueDetails } from 'wasp/server/operations';

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
      spaces: true,
    },
  });

  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

  return venue;
};
