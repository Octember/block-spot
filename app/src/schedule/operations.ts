import { Space, Venue } from "wasp/entities";
import { HttpError } from "wasp/server";
import { GetVenueInfo } from "wasp/server/operations";


export const getVenueInfo: GetVenueInfo<void, (Venue & { spaces: Space[] })[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Venue.findMany({
    where: {
    //   user: {
    //     id: context.user.id,
    //   },
    },
    include: {
      spaces: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};