import { PrismaClient, ReservationStatus } from "@prisma/client";
import { User } from "wasp/entities";
import { HttpError } from "wasp/server";

// Define the context type
type Context = {
  user?: User;
  entities: PrismaClient;
};

export type CancelRecurringReservationPayload = {
  id: string;
};

export type CancelSingleOccurrencePayload = {
  reservationId: string;
};

/**
 * Cancels a single occurrence of a recurring reservation
 */
export const cancelSingleOccurrence = async (
  args: CancelSingleOccurrencePayload,
  context: Context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  // Get the reservation
  const reservation = await context.entities.reservation.findUnique({
    where: { id: args.reservationId },
    include: { recurringReservation: true }
  });

  if (!reservation) {
    throw new HttpError(404, "Reservation not found");
  }

  if (!reservation.recurringReservationId) {
    throw new HttpError(400, "This is not a recurring reservation occurrence");
  }

  // Check if user has permission to cancel
  if (!reservation.recurringReservation || reservation.recurringReservation.createdById !== context.user.id) {
    throw new HttpError(403, "You do not have permission to cancel this reservation");
  }

  // Cancel the occurrence
  const updatedReservation = await context.entities.reservation.update({
    where: { id: args.reservationId },
    data: { 
      status: ReservationStatus.CANCELLED,
      isException: true,
      updatedAt: new Date()
    }
  });

  return updatedReservation;
};

/**
 * Cancels an entire recurring reservation series and all its future occurrences
 */
export const cancelRecurringReservation = async (
  args: CancelRecurringReservationPayload,
  context: Context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const now = new Date();

  // Get the recurring reservation
  const recurringReservation = await context.entities.recurringReservation.findUnique({
    where: { id: args.id }
  });

  if (!recurringReservation) {
    throw new HttpError(404, "Recurring reservation not found");
  }

  // Check if user has permission to cancel
  if (recurringReservation.createdById !== context.user.id) {
    throw new HttpError(403, "You do not have permission to cancel this recurring reservation");
  }

  // Use a transaction to ensure both operations succeed or fail together
  const result = await context.entities.$transaction([
    // Update the recurring reservation to mark it as canceled
    context.entities.recurringReservation.update({
      where: { id: args.id },
      data: { 
        updatedAt: now
      }
    }),
    
    // Cancel all future occurrences
    context.entities.reservation.updateMany({
      where: {
        recurringReservationId: args.id,
        startTime: { gte: now },
        status: { not: ReservationStatus.CANCELLED }
      },
      data: {
        status: ReservationStatus.CANCELLED,
        updatedAt: now
      }
    })
  ]);

  // Return the updated recurring reservation
  return result[0];
}; 