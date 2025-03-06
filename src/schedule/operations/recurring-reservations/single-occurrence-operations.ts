import {
  PrismaClient,
  ReservationStatus
} from "@prisma/client";
import {
  User
} from "wasp/entities";
import { HttpError } from "wasp/server";
import { checkForConflicts } from './recurring-reservations';

// Define the context type
type Context = {
  user?: User;
  entities: PrismaClient;
};

export type ModifySingleOccurrencePayload = {
  reservationId: string;
  startTime?: Date;
  endTime?: Date;
  description?: string;
  status?: ReservationStatus;
};

/**
 * Modifies a single occurrence of a recurring reservation
 * This allows changing the time, description, or other properties of just one occurrence
 * without affecting the rest of the series
 */
export const modifySingleOccurrence = async (
  args: ModifySingleOccurrencePayload,
  context: Context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  // Get the reservation
  const reservation = await context.entities.reservation.findUnique({
    where: { id: args.reservationId },
    include: { 
      recurringReservation: true,
      space: true
    }
  });

  if (!reservation) {
    throw new HttpError(404, "Reservation not found");
  }

  if (!reservation.recurringReservationId) {
    throw new HttpError(400, "This is not a recurring reservation occurrence");
  }

  // Prepare the update data
  const updateData: {
    description?: string;
    status?: ReservationStatus;
    startTime?: Date;
    endTime?: Date;
    isException?: boolean;
  } = {};
  
  // Only update fields that were provided
  if (args.description !== undefined) {
    updateData.description = args.description;
  }
  
  if (args.status !== undefined) {
    updateData.status = args.status;
  }
  
  // If changing the time, we need to check for conflicts
  if (args.startTime || args.endTime) {
    const newStartTime = args.startTime || reservation.startTime;
    const newEndTime = args.endTime || reservation.endTime;
    
    // Check for conflicts with the new time
    const conflicts = await checkForConflicts(
      reservation.spaceId,
      [{ startTime: newStartTime, endTime: newEndTime }],
      context.entities,
      reservation.id // Exclude this reservation from conflict check
    );
    
    if (conflicts.length > 0) {
      throw new HttpError(409, "The new time conflicts with an existing reservation");
    }
    
    // Update the times
    updateData.startTime = newStartTime;
    updateData.endTime = newEndTime;
  }
  
  // Add a flag to indicate this occurrence has been modified from the series pattern
  updateData.isException = true;
  
  // Update the occurrence
  const updatedReservation = await context.entities.reservation.update({
    where: { id: args.reservationId },
    data: updateData
  });
  
  return updatedReservation;
}; 