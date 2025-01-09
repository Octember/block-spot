import { Reservation, Space, Venue } from "wasp/entities";
import { HttpError } from "wasp/server";
import { CreateReservation, GetVenueInfo } from "wasp/server/operations";


export const getVenueInfo: GetVenueInfo<void, (Venue & { spaces: (Space & { reservations: Reservation[] })[] })[]> = async (_args, context) => {
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
      spaces: {
        include: {
          reservations: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

type CreateReservationPayload = Pick<Reservation, "spaceId" | "startTime" | "endTime" | "description">;

export const createReservation: CreateReservation<CreateReservationPayload, Reservation> = async (args, context) => {

  console.log("createReservation", args);
  if (!context.user) {
    throw new HttpError(401)
  }

  return context.entities.Reservation.create({
    data: {
      spaceId: args.spaceId,
      startTime: args.startTime,
      endTime: args.endTime,
      userId: context.user.id,
      status: "CONFIRMED",
      description: args.description,
    },
  });
};