import { Reservation, Space, Venue } from "wasp/entities";
import { HttpError } from "wasp/server";
import { CreateReservation, DeleteReservation, GetVenueInfo, UpdateReservation } from "wasp/server/operations";


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

export const deleteReservation: DeleteReservation<DeleteReservationPayload, Reservation> = async (args, context) => {
  return context.entities.Reservation.delete({
    where: { id: args.id },
  });
};

type UpdateReservationPayload = Pick<Reservation, "id"> & Partial<Pick<Reservation, "description" | "startTime" | "endTime" | "spaceId">>;

export const updateReservation: UpdateReservation<UpdateReservationPayload, Reservation> = async (args, context) => {
  return context.entities.Reservation.update({
    where: { id: args.id },
    data: { description: args.description, startTime: args.startTime, endTime: args.endTime, spaceId: args.spaceId },
  });
};
