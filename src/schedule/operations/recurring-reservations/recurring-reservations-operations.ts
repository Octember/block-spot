import {
  PrismaClient,
  RecurrenceFrequency,
  ReservationStatus
} from "@prisma/client";
import {
  User
} from "wasp/entities";
import { HttpError } from "wasp/server";
import { getStartEndTime } from "../new-reservations";
import { checkForConflicts, getNextOccurrences, validateRecurringReservationAllowed } from './recurring-reservations';

// Define the context type
type Context = {
  user?: User;
  entities: PrismaClient;
};

export type CreateRecurringReservationPayload = {
  spaceId: string;
  organizationId: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  frequency: string; // 'daily', 'weekly', 'monthly'
  interval: number; // e.g., every 2 weeks
  endsOn?: Date; // Optional end date for the series
};

export type CancelRecurringReservationPayload = {
  id: string;
};

export type CancelSingleOccurrencePayload = {
  reservationId: string;
};

/**
 * Creates a recurring reservation and generates its occurrences
 */
export const createRecurringReservation = async (
  args: CreateRecurringReservationPayload,
  context: Context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  // Validate that the organization allows recurring reservations
  const isAllowed = await validateRecurringReservationAllowed(
    args.organizationId,
    context.entities
  );

  if (!isAllowed) {
    throw new HttpError(403, "Organization does not allow recurring reservations");
  }

  // Get the space
  const space = await context.entities.space.findUnique({
    where: { id: args.spaceId },
    include: { venue: true }
  });

  if (!space) {
    throw new HttpError(404, "Space not found");
  }

  // Convert to UTC and validate times
  const { startTime, endTime } = getStartEndTime(
    args.startTime,
    args.endTime,
    space.venue
  );

  // Generate occurrences
  const occurrences = getNextOccurrences(
    startTime,
    endTime,
    args.frequency,
    args.interval,
    args.endsOn
  );

  if (occurrences.length === 0) {
    throw new HttpError(400, "No valid occurrences could be generated");
  }

  // Check for conflicts
  const conflicts = await checkForConflicts(
    args.spaceId,
    occurrences,
    context.entities
  );

  if (conflicts.length > 0) {
    throw new HttpError(409, "Some occurrences conflict with existing reservations");
  }

  // Create the recurring reservation
  const recurringReservation = await context.entities.recurringReservation.create({
    data: {
      createdById: context.user.id,
      spaceId: args.spaceId,
      organizationId: args.organizationId,
      startTime,
      endTime,
      frequency: args.frequency as RecurrenceFrequency,
      interval: args.interval,
      endsOn: args.endsOn,
      description: args.description
    }
  });

  // Create the individual reservation occurrences
  await context.entities.reservation.createMany({
    data: occurrences.map((occurrence) => ({
      userId: context?.user?.id || "", 
      createdById: context?.user?.id || "",
      startTime: occurrence.startTime,
      endTime: occurrence.endTime,
      status: ReservationStatus.CONFIRMED,
      spaceId: args.spaceId,
      description: args.description,
      recurringReservationId: recurringReservation.id,
    }))
  });

  return recurringReservation;
};

/**
 * Cancels a recurring reservation and its occurrences
 */
export const cancelRecurringReservation = async (
  args: CancelRecurringReservationPayload,
  context: Context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  // Get the recurring reservation
  const recurringReservation = await context.entities.recurringReservation.findUnique({
    where: { id: args.id }
  });

  if (!recurringReservation) {
    throw new HttpError(404, "Recurring reservation not found");
  }

  // Cancel all occurrences
  await context.entities.reservation.updateMany({
    where: {
      recurringReservationId: args.id,
      status: { not: ReservationStatus.CANCELLED }
    },
    data: {
      status: ReservationStatus.CANCELLED
    }
  });

  // If we're cancelling the entire series, we could add a cancelledAt field to the RecurringReservation model
  // For now, we'll just return the recurring reservation
  return recurringReservation;
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

  // Cancel the occurrence
  await context.entities.reservation.update({
    where: { id: args.reservationId },
    data: { 
      status: ReservationStatus.CANCELLED,
      isException: true
    }
  });
};

/**
 * Extends recurring reservations by generating more occurrences
 * This function can be called by a scheduled job
 */
export const extendRecurringReservations = async (context: Context) => {
  const now = new Date();
  // Look ahead 4 weeks instead of 2 for better planning
  const lookAheadPeriod = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  // Find active recurring reservations
  const activeRecurringReservations = await context.entities.recurringReservation.findMany({
    where: {
      // Only include recurring reservations that don't have an end date
      // or have an end date in the future
      OR: [
        { endsOn: null },
        { endsOn: { gt: now } }
      ]
    },
    include: {
      space: {
        include: { venue: true }
      },
      reservations: {
        where: {
          startTime: { gt: now },
          status: { not: 'CANCELLED' } // Only consider non-cancelled reservations
        },
        orderBy: { startTime: "desc" } // Get the latest reservation first
      }
    }
  });

  // For each recurring reservation, check if we need to generate more occurrences
  for (const recurringReservation of activeRecurringReservations) {
    // If there are no future reservations, generate from now
    let startFromDate = now;
    
    // If there are future reservations, start from the latest one
    if (recurringReservation.reservations.length > 0) {
      // Get the latest reservation (first in the array since we ordered by desc)
      const latestReservation = recurringReservation.reservations[0];
      
      // If the latest reservation is beyond our look-ahead period, we don't need to generate more
      if (latestReservation.startTime > lookAheadPeriod) {
        continue;
      }
      
      // Start generating from the latest reservation's start time
      startFromDate = latestReservation.startTime;
    }

    // Generate new occurrences starting from the appropriate date
    const newOccurrences = getNextOccurrences(
      recurringReservation.startTime,
      recurringReservation.endTime,
      recurringReservation.frequency,
      recurringReservation.interval,
      recurringReservation.endsOn || undefined,
      startFromDate
    );

    // If no new occurrences were generated, continue to the next recurring reservation
    if (newOccurrences.length === 0) {
      continue;
    }

    // Check for conflicts
    const conflicts = await checkForConflicts(
      recurringReservation.spaceId,
      newOccurrences,
      context.entities,
      recurringReservation.id
    );

    // Filter out conflicting occurrences
    const validOccurrences = newOccurrences.filter(
      (occurrence) => !conflicts.some(
        (conflict) => 
          conflict.startTime.getTime() === occurrence.startTime.getTime() &&
          conflict.endTime.getTime() === occurrence.endTime.getTime()
      )
    );

    // Create new occurrences
    if (validOccurrences.length > 0) {
      await context.entities.reservation.createMany({
        data: validOccurrences.map((occurrence) => ({
          userId: recurringReservation.createdById,
          createdById: recurringReservation.createdById,
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
          status: ReservationStatus.CONFIRMED,
          spaceId: recurringReservation.spaceId,
          description: recurringReservation.description,
          recurringReservationId: recurringReservation.id,
          isException: false
        }))
      });
    }
  }

  return { success: true, processedCount: activeRecurringReservations.length };
}; 