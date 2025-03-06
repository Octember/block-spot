import { RecurringReservation, Reservation, Space, Venue } from '@prisma/client';
import { HttpError } from 'wasp/server';
import { GetRecurringReservations } from 'wasp/server/operations';

type GetRecurringReservationsArgs = {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filters
  venueId?: string;
  spaceId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'ALL';
};

// Define the shape of a recurring reservation with its relations
type RecurringReservationWithRelations = RecurringReservation & {
  reservations: Reservation[];
  space: Space & {
    venue: Venue;
  };
};

type PaginatedResponse = {
  data: RecurringReservationWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};


/**
 * Query to get recurring reservations for the current user with filtering and pagination
 * 
 * @param args - Filter and pagination options
 * @returns Paginated array of recurring reservations with their associated reservations
 */
export const getRecurringReservations: GetRecurringReservations<
  GetRecurringReservationsArgs,
  PaginatedResponse
> = async (args, {entities, user}) => {
  // Check if user is authenticated
  if (!user) {
    throw new HttpError(401, 'You must be logged in to view recurring reservations');
  }

  // Default pagination values
  const page = args.page || 1;
  const limit = args.limit || 10;
  const skip = (page - 1) * limit;
  
  try {
    // Get total count for pagination
    const totalItems = await entities.RecurringReservation.count({
      where: {
        ...(args.spaceId ? { spaceId: args.spaceId } : {}),
        ...(args.venueId ? { space: { venueId: args.venueId } } : {}),
        ...(args.startDate ? { startTime: { gte: new Date(args.startDate) } } : {}),
        ...(args.endDate ? { endTime: { lte: new Date(args.endDate) } } : {}),
        ...(args.status && args.status !== 'ALL' ? { status: args.status } : {})
      }
    });
    
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get recurring reservations with pagination
    const recurringReservations = await entities.RecurringReservation.findMany({
      where: {
        ...(args.spaceId ? { spaceId: args.spaceId } : {}),
        ...(args.venueId ? { space: { venueId: args.venueId } } : {}),
        ...(args.startDate ? { startTime: { gte: new Date(args.startDate) } } : {}),
        ...(args.endDate ? { endTime: { lte: new Date(args.endDate) } } : {}),
        ...(args.status && args.status !== 'ALL' ? { status: args.status } : {})
      },
      include: {
        space: {
          include: {
            venue: true
          }
        },
        reservations: {
          orderBy: {
            startTime: 'asc'
          },
          where: {
            // Only include future or current reservations
            startTime: {
              gte: new Date()
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      skip,
      take: limit
    });

    return {
      data: recurringReservations,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error fetching recurring reservations:', error);
    throw new HttpError(500, 'Failed to fetch recurring reservations');
  }
}; 