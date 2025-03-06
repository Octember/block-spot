import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecurringReservations } from '../get-recurring-reservation';
import { HttpError } from 'wasp/server';

// Mock data
const mockUser = { id: 'user-1', email: 'test@example.com' };
const mockRecurringReservations = [
  {
    id: 'rec-1',
    userId: 'user-1',
    startTime: new Date('2023-01-01T10:00:00Z'),
    endTime: new Date('2023-01-01T11:00:00Z'),
    frequency: 'WEEKLY',
    interval: 1,
    description: 'Weekly meeting',
    spaceId: 'space-1',
    status: 'ACTIVE',
    space: {
      id: 'space-1',
      name: 'Conference Room A',
      venueId: 'venue-1',
      venue: {
        id: 'venue-1',
        name: 'Main Office'
      }
    },
    reservations: [
      {
        id: 'res-1',
        startTime: new Date('2023-01-01T10:00:00Z'),
        endTime: new Date('2023-01-01T11:00:00Z'),
        status: 'CONFIRMED'
      },
      {
        id: 'res-2',
        startTime: new Date('2023-01-08T10:00:00Z'),
        endTime: new Date('2023-01-08T11:00:00Z'),
        status: 'CONFIRMED'
      }
    ]
  }
];

// Mock context
const mockContext = {
  user: mockUser,
  entities: {
    RecurringReservation: {
      findMany: vi.fn().mockResolvedValue(mockRecurringReservations),
      count: vi.fn().mockResolvedValue(1)
    }
  }
};

describe('getRecurringReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if user is not authenticated', async () => {
    const contextWithoutUser = { ...mockContext, user: null };
    
    await expect(getRecurringReservations({}, contextWithoutUser as any))
      .rejects
      .toThrow(new HttpError(401, 'You must be logged in to view recurring reservations'));
  });

  it('should return paginated recurring reservations for the authenticated user', async () => {
    const result = await getRecurringReservations({}, mockContext as any);
    
    expect(mockContext.entities.RecurringReservation.count).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id
      }
    });
    
    expect(mockContext.entities.RecurringReservation.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id
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
            startTime: {
              gte: expect.any(Date)
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      skip: 0,
      take: 10
    });
    
    expect(result).toEqual({
      data: mockRecurringReservations,
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1
      }
    });
  });

  it('should apply filters when provided', async () => {
    const filters = {
      venueId: 'venue-1',
      spaceId: 'space-1',
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'ACTIVE' as const,
      page: 2,
      limit: 5
    };
    
    await getRecurringReservations(filters, mockContext as any);
    
    expect(mockContext.entities.RecurringReservation.count).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        spaceId: 'space-1',
        space: {
          venueId: 'venue-1'
        },
        startTime: {
          gte: new Date('2023-01-01')
        },
        endTime: {
          lte: new Date('2023-01-31')
        },
        status: 'ACTIVE'
      }
    });
    
    expect(mockContext.entities.RecurringReservation.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        spaceId: 'space-1',
        space: {
          venueId: 'venue-1'
        },
        startTime: {
          gte: new Date('2023-01-01')
        },
        endTime: {
          lte: new Date('2023-01-31')
        },
        status: 'ACTIVE'
      },
      include: expect.any(Object),
      orderBy: expect.any(Object),
      skip: 5,
      take: 5
    });
  });

  it('should handle errors and throw an HttpError with status 500', async () => {
    const errorContext = {
      user: mockUser,
      entities: {
        RecurringReservation: {
          findMany: vi.fn().mockRejectedValue(new Error('Database error')),
          count: vi.fn().mockResolvedValue(0)
        }
      }
    };
    
    await expect(getRecurringReservations({}, errorContext as any))
      .rejects
      .toThrow(new HttpError(500, 'Failed to fetch recurring reservations'));
  });
}); 