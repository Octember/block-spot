import {
  PrismaClient,
  RecurrenceFrequency,
  ReservationStatus
} from "@prisma/client";
import {
  User
} from "wasp/entities";
import { HttpError } from "wasp/server";
import { checkForConflicts, getNextOccurrences } from './recurring-reservations';

// Define the context type
type Context = {
  user?: User;
  entities: PrismaClient;
};

export type UpdateRecurringReservationPayload = {
  id: string;
  description?: string;
  frequency?: string;
  interval?: number;
  endsOn?: Date;
  startTime?: Date; // Optional new start time for future occurrences
  endTime?: Date;   // Optional new end time for future occurrences
  preservePastOccurrences?: boolean; // Whether to keep past occurrences unchanged
};

/**
 * Updates a recurring reservation and regenerates future occurrences
 */
export const updateRecurringReservation = async (
  args: UpdateRecurringReservationPayload,
  context: Context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const now = new Date();

  // Get the recurring reservation
  const recurringReservation = await context.entities.recurringReservation.findUnique({
    where: { id: args.id },
    include: {
      space: {
        include: { venue: true }
      },
      reservations: {
        orderBy: { startTime: "asc" }
      }
    }
  });

  if (!recurringReservation) {
    throw new HttpError(404, "Recurring reservation not found");
  }

  // Determine if we need to update the start/end times
  const newStartTime = args.startTime || recurringReservation.startTime;
  const newEndTime = args.endTime || recurringReservation.endTime;
  
  // Update the recurring reservation
  const updatedRecurringReservation = await context.entities.recurringReservation.update({
    where: { id: args.id },
    data: {
      frequency: args.frequency as RecurrenceFrequency,
      interval: args.interval,
      endsOn: args.endsOn,
      description: args.description,
      startTime: newStartTime,
      endTime: newEndTime,
      updatedAt: now
    }
  });

  // Handle future occurrences
  // If preservePastOccurrences is true or undefined, we only modify future occurrences
  const preservePast = args.preservePastOccurrences !== false;
  
  // Cancel future occurrences
  await context.entities.reservation.updateMany({
    where: {
      recurringReservationId: args.id,
      startTime: { gt: now },
      // Don't cancel exceptions if we're just updating the description or end date
      ...(args.frequency || args.interval || args.startTime || args.endTime 
        ? {} 
        : { isException: false })
    },
    data: {
      status: ReservationStatus.CANCELLED
    }
  });

  // Generate new occurrences
  const occurrences = getNextOccurrences(
    newStartTime,
    newEndTime,
    args.frequency || recurringReservation.frequency,
    args.interval || recurringReservation.interval,
    args.endsOn !== undefined ? args.endsOn : recurringReservation.endsOn || undefined,
    now
  );

  // Check for conflicts
  const conflicts = await checkForConflicts(
    recurringReservation.spaceId,
    occurrences,
    context.entities
  );

  if (conflicts.length > 0) {
    throw new HttpError(409, "Some occurrences conflict with existing reservations");
  }

  // Create new occurrences
  await context.entities.reservation.createMany({
    data: occurrences.map((occurrence) => ({
      userId: context.user!.id,
      createdById: context.user!.id,
      startTime: occurrence.startTime,
      endTime: occurrence.endTime,
      status: ReservationStatus.CONFIRMED,
      spaceId: recurringReservation.spaceId,
      description: args.description || recurringReservation.description,
      recurringReservationId: args.id,
      isException: false
    }))
  });

  return updatedRecurringReservation;
}; 