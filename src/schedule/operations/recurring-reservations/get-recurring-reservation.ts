import { RecurringReservation, Reservation, Space, Venue } from "@prisma/client";
import { HttpError } from "wasp/server";
import { GetRecurringReservations } from "wasp/server/operations";

export type GetRecurringReservationsArgs = {
  organizationId: string;
}

type RecurringReservationWithReservations = RecurringReservation & {
  reservations: Reservation[];
  space: Space & {
    venue: Venue;
  };
}
/**
 * Gets all recurring reservations for the current user
 */
export const getRecurringReservations: GetRecurringReservations<GetRecurringReservationsArgs, RecurringReservationWithReservations[]> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  // Get all recurring reservations created by the user
  const recurringReservations = await context.entities.RecurringReservation.findMany({
    where: {
      organizationId: args.organizationId,
    },
    include: {
      // Include the first few reservations to show in the UI
      reservations: {
        take: 5,
        orderBy: {
          startTime: 'asc'
        }
      },
      space: {
        include: {
          venue: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return recurringReservations;
}; 