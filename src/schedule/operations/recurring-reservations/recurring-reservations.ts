import { PrismaClient } from "@prisma/client";

// Helper function to check if recurring reservations are allowed for an organization
export async function validateRecurringReservationAllowed(
  organizationId: string,
  prisma: PrismaClient
): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      schedulingConfig: true
    },
  });

  return !!organization?.schedulingConfig?.allowsRecurringReservations;
}

// Helper function to generate the next occurrences of a recurring reservation
export function getNextOccurrences(
  startTime: Date,
  endTime: Date,
  frequency: string,
  interval: number,
  endsOn?: Date,
  startFrom?: Date
): { startTime: Date; endTime: Date }[] {
  const occurrences: { startTime: Date; endTime: Date }[] = [];
  const now = startFrom || new Date();
  const maxDate = endsOn || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // Default to 90 days if no end date
  
  const currentStart = new Date(startTime);
  const currentEnd = new Date(endTime);
  
  // Generate occurrences until we reach the end date
  while (currentStart <= maxDate) {
    // Only add future occurrences
    if (currentStart >= now) {
      occurrences.push({
        startTime: new Date(currentStart),
        endTime: new Date(currentEnd)
      });
    }
    
    // Calculate the next occurrence based on frequency and interval
    if (frequency === 'daily') {
      currentStart.setDate(currentStart.getDate() + interval);
      currentEnd.setDate(currentEnd.getDate() + interval);
    } else if (frequency === 'weekly') {
      currentStart.setDate(currentStart.getDate() + (7 * interval));
      currentEnd.setDate(currentEnd.getDate() + (7 * interval));
    } else if (frequency === 'monthly') {
      currentStart.setMonth(currentStart.getMonth() + interval);
      currentEnd.setMonth(currentEnd.getMonth() + interval);
    }
  }
  
  return occurrences;
}

// Helper function to check for conflicts with existing reservations
export async function checkForConflicts(
  spaceId: string,
  occurrences: { startTime: Date; endTime: Date }[],
  prisma: PrismaClient,
  excludeReservationId?: string
) {
  // Extract all start and end times
  const timeRanges = occurrences.map(o => ({
    startTime: o.startTime,
    endTime: o.endTime
  }));
  
  // Check for conflicts with existing reservations
  const conflicts: { startTime: Date; endTime: Date }[] = [];
  
  for (const { startTime, endTime } of timeRanges) {
    const existingReservations = await prisma.reservation.findMany({
      where: {
        spaceId,
        status: { not: 'CANCELLED' },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
        OR: [
          {
            // Reservation starts during our time slot
            startTime: {
              gte: startTime,
              lt: endTime
            }
          },
          {
            // Reservation ends during our time slot
            endTime: {
              gt: startTime,
              lte: endTime
            }
          },
          {
            // Reservation completely encompasses our time slot
            startTime: {
              lte: startTime
            },
            endTime: {
              gte: endTime
            }
          }
        ]
      }
    });
    
    if (existingReservations.length > 0) {
      conflicts.push({ startTime, endTime });
    }
  }
  
  return conflicts;
} 