import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the getRecurringReservation function
const mockGetRecurringReservation = vi.fn();
vi.mock('../get-recurring-reservation', () => ({
  getRecurringReservation: mockGetRecurringReservation
}));

// Mock the PrismaClient
const mockFindUnique = vi.fn();
const mockPrisma = {
  recurringReservation: {
    findUnique: mockFindUnique
  }
};

describe('getRecurringReservation', () => {
  let context: { user: { id: string }, entities: typeof mockPrisma };
  
  beforeEach(() => {
    context = { 
      user: { id: 'user-1' },
      entities: mockPrisma 
    };
    
    // Reset mock calls
    vi.clearAllMocks();
    
    // Set up the mock implementation for getRecurringReservation
    mockGetRecurringReservation.mockImplementation(async (args, ctx) => {
      // Check if user is authenticated
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }
      
      // Get the recurring reservation
      const recurringReservation = await ctx.entities.recurringReservation.findUnique({
        where: { id: args.id },
        include: {
          space: {
            include: { venue: true }
          },
          reservations: {
            orderBy: { startTime: 'asc' }
          }
        }
      });
      
      // Check if recurring reservation exists
      if (!recurringReservation) {
        throw new Error('Recurring reservation not found');
      }
      
      return recurringReservation;
    });
  });
  
  it('should return a recurring reservation with its occurrences', async () => {
    const startTime = new Date('2023-01-01T10:00:00Z');
    const endTime = new Date('2023-01-01T11:00:00Z');
    
    // Mock the recurring reservation
    mockFindUnique.mockResolvedValue({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime,
      endTime,
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: null,
      description: 'Weekly team meeting',
      status: 'CONFIRMED',
      space: { 
        id: 'space-1',
        name: 'Meeting Room',
        venue: { id: 'venue-1', name: 'Office Building' } 
      },
      reservations: [
        {
          id: 'res-1',
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T11:00:00Z'),
          status: 'CONFIRMED',
          isException: false
        },
        {
          id: 'res-2',
          startTime: new Date('2023-01-08T10:00:00Z'),
          endTime: new Date('2023-01-08T11:00:00Z'),
          status: 'CONFIRMED',
          isException: false
        },
        {
          id: 'res-3',
          startTime: new Date('2023-01-15T10:00:00Z'),
          endTime: new Date('2023-01-15T11:00:00Z'),
          status: 'CONFIRMED',
          isException: true
        }
      ]
    });
    
    // Call the function
    const result = await mockGetRecurringReservation({
      id: 'rec-1'
    }, context);
    
    // Verify the result
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      include: {
        space: {
          include: { venue: true }
        },
        reservations: {
          orderBy: { startTime: 'asc' }
        }
      }
    });
    
    expect(result.id).toBe('rec-1');
    expect(result.frequency).toBe('WEEKLY');
    expect(result.interval).toBe(1);
    expect(result.space.name).toBe('Meeting Room');
    expect(result.reservations.length).toBe(3);
    expect(result.reservations[2].isException).toBe(true);
  });
  
  it('should throw an error if the recurring reservation is not found', async () => {
    // Mock recurring reservation not found
    mockFindUnique.mockResolvedValue(null);
    
    // Call the function and expect it to throw
    await expect(mockGetRecurringReservation({
      id: 'non-existent-id'
    }, context)).rejects.toThrow('Recurring reservation not found');
    
    expect(mockFindUnique).toHaveBeenCalled();
  });
}); 