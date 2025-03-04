import { HttpError } from "wasp/server";
import { Reservation, Space, User, Venue } from "wasp/entities";
import { GetUserBookings } from "wasp/server/operations";

type GetUserBookingsInput = {
  type: "upcoming" | "past";
  limit?: number;
  offset?: number;
};

type GetUserBookingsOutput = {
  bookings: (Reservation & {
    space: Space & {
      venue: Venue;
    };
  })[];
  totalCount: number;
};

export const getUserBookings: GetUserBookings<
  GetUserBookingsInput,
  GetUserBookingsOutput
> = async ({ type, limit = 10, offset = 0 }, context) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in to view your bookings");
  }

  const userId = context.user.id;
  const now = new Date();

  // Define the where clause based on the type (upcoming or past)
  const whereClause = type === "upcoming"
    ? {
        userId,
        // For upcoming bookings: endTime is in the future and status is not CANCELLED
        endTime: {
          gte: now,
        },
        // Don't include cancelled bookings in upcoming
        status: {
          not: "CANCELLED" as const,
        },
      }
    : {
        userId,
        // For past bookings: endTime is in the past
        endTime: {
          lt: now,
        },
        // For past bookings, we still want to exclude cancelled reservations
        status: {
          not: "CANCELLED" as const,
        },
      };

  // Get the total count for pagination
  const totalCount = await context.entities.Reservation.count({
    where: whereClause,
  });

  // Get the bookings with related space and venue information
  const bookings = await context.entities.Reservation.findMany({
    where: whereClause,
    include: {
      space: {
        include: {
          venue: true,
        },
      },
    },
    orderBy: {
      startTime: type === "upcoming" ? "asc" : "desc",
    },
    skip: offset,
    take: limit,
  });

  return {
    bookings,
    totalCount,
  };
}; 