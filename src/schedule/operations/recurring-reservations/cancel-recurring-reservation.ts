import { RecurringReservation, Reservation } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { CancelRecurringReservation, CancelSingleOccurrence } from 'wasp/server/operations';

type CancelRecurringReservationArgs = {
  recurringReservationId: string;
};

type CancelSingleOccurrenceArgs = {
  recurringReservationId: string;
  reservationId: string;
};


/**
 * Cancels an entire recurring reservation series
 * 
 * @param args - The recurring reservation ID to cancel
 * @param context - The request context containing user and entities
 * @returns The cancelled recurring reservation
 */
export const cancelRecurringReservation: CancelRecurringReservation<
  CancelRecurringReservationArgs,
  RecurringReservation
> = async (args, {entities, user}) => {
  if (!user) {
    throw new HttpError(401, 'You must be logged in to cancel a recurring reservation');
  }

  const { recurringReservationId } = args;

  try {
    const recurringReservation = await entities.RecurringReservation.findUnique({
      where: { id: recurringReservationId },
      include: { reservations: true }
    });

    // Check if the recurring reservation exists
    if (!recurringReservation) {
      throw new HttpError(404, 'Recurring reservation not found');
    }

    // Check if the user owns the recurring reservation
    if (recurringReservation.createdById !== user.id) {
      throw new HttpError(403, 'You do not have permission to cancel this recurring reservation');
    }

    // Update the recurring reservation status to CANCELLED
    const updatedRecurringReservation = await entities.RecurringReservation.update({
      where: { id: recurringReservationId },
      data: { status: 'CANCELLED' }
    });

    // Cancel all future reservations in the series
    await entities.Reservation.updateMany({
      where: {
        recurringReservationId,
        startTime: { gte: new Date() },
        status: 'CONFIRMED'
      },
      data: { status: 'CANCELLED' }
    });

    return updatedRecurringReservation;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Error cancelling recurring reservation:', error);
    throw new HttpError(500, 'Failed to cancel recurring reservation');
  }
};

/**
 * Cancels a single occurrence of a recurring reservation
 * 
 * @param args - The recurring reservation ID and reservation ID to cancel
 * @param context - The request context containing user and entities
 * @returns The cancelled reservation
 */
export const cancelSingleOccurrence: CancelSingleOccurrence<
  CancelSingleOccurrenceArgs,
  Reservation
> = async (args, {entities, user}) => {
  // Check if user is authenticated
  if (!user) {
    throw new HttpError(401, 'You must be logged in to cancel a reservation');
  }

  const { recurringReservationId, reservationId } = args;

  try {
    // Find the recurring reservation
    const recurringReservation = await entities.RecurringReservation.findUnique({
      where: { id: recurringReservationId }
    });

    // Check if the recurring reservation exists
    if (!recurringReservation) {
      throw new HttpError(404, 'Recurring reservation not found');
    }

    // Check if the user owns the recurring reservation
    if (recurringReservation.createdById !== user.id) {
      throw new HttpError(403, 'You do not have permission to cancel this reservation');
    }

    // Find the specific reservation
    const reservation = await entities.Reservation.findUnique({
      where: { id: reservationId }
    });

    // Check if the reservation exists
    if (!reservation) {
      throw new HttpError(404, 'Reservation not found');
    }

    // Check if the reservation belongs to the recurring reservation
    if (reservation.recurringReservationId !== recurringReservationId) {
      throw new HttpError(400, 'Reservation does not belong to the specified recurring reservation');
    }

    // Check if the reservation is already cancelled
    if (reservation.status === 'CANCELLED') {
      throw new HttpError(400, 'Reservation is already cancelled');
    }

    // Check if the reservation is in the future
    if (new Date(reservation.startTime) < new Date()) {
      throw new HttpError(400, 'Cannot cancel a past reservation');
    }

    // Update the reservation status to CANCELLED
    const updatedReservation = await entities.Reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' }
    });

    return updatedReservation;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Error cancelling reservation:', error);
    throw new HttpError(500, 'Failed to cancel reservation');
  }
}; 