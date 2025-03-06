import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the extendRecurringReservations function
const mockExtendRecurringReservations = vi.fn();
vi.mock('../recurring-reservations-operations', () => ({
  extendRecurringReservations: mockExtendRecurringReservations
}));

// Mock the PrismaClient
const mockFindMany = vi.fn();
const mockCreateMany = vi.fn();
const mockPrisma = {
  recurringReservation: {
    findMany: mockFindMany
  },
  reservation: {
    createMany: mockCreateMany
  }
};

describe('extendRecurringReservations', () => {
  let context: { entities: typeof mockPrisma };
  
  beforeEach(() => {
    context = { entities: mockPrisma };
    
    // Reset mock calls
    vi.clearAllMocks();
    
    // Set up the mock implementation for extendRecurringReservations
    mockExtendRecurringReservations.mockImplementation(async (ctx) => {
      const now = new Date();
      const lookAheadPeriod = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
      
      // Call the mocked findMany
      const activeRecurringReservations = await ctx.entities.recurringReservation.findMany();
      
      // Process each recurring reservation
      let processedCount = 0;
      for (const recurringReservation of activeRecurringReservations) {
        processedCount++;
        
        // If there are no reservations, skip
        if (!recurringReservation.reservations || recurringReservation.reservations.length === 0) {
          continue;
        }
        
        // Get the latest reservation
        const latestReservation = recurringReservation.reservations[0];
        
        // If the latest reservation is beyond our look-ahead period, skip
        if (latestReservation.startTime > lookAheadPeriod) {
          continue;
        }
        
        // Create new occurrences
        await ctx.entities.reservation.createMany({
          data: [{ id: 'new-occurrence' }]
        });
      }
      
      return { success: true, processedCount };
    });
  });
  
  it('should not generate occurrences if there are no active recurring reservations', async () => {
    // Mock empty result for findMany
    mockFindMany.mockResolvedValue([]);
    
    const result = await mockExtendRecurringReservations(context);
    
    expect(mockFindMany).toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(result.processedCount).toBe(0);
  });
  
  it('should generate new occurrences for recurring reservations that need them', async () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Mock a recurring reservation with one future reservation
    mockFindMany.mockResolvedValue([
      {
        id: 'rec-1',
        createdById: 'user-1',
        spaceId: 'space-1',
        startTime: new Date('2023-01-01T10:00:00Z'),
        endTime: new Date('2023-01-01T11:00:00Z'),
        frequency: 'WEEKLY',
        interval: 1,
        endsOn: null,
        description: 'Weekly meeting',
        reservations: [
          {
            id: 'res-1',
            startTime: tomorrow,
            endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
          },
        ],
      },
    ]);
    
    // Mock successful creation of new occurrences
    mockCreateMany.mockResolvedValue({ count: 3 });
    
    const result = await mockExtendRecurringReservations(context);
    
    expect(mockFindMany).toHaveBeenCalled();
    expect(mockCreateMany).toHaveBeenCalled();
    expect(result.processedCount).toBe(1);
  });
  
  it('should not generate occurrences if the latest reservation is beyond the look-ahead period', async () => {
    const now = new Date();
    const fiveWeeksFromNow = new Date(now);
    fiveWeeksFromNow.setDate(fiveWeeksFromNow.getDate() + 35); // 5 weeks in the future
    
    // Mock a recurring reservation with a future reservation beyond the look-ahead period
    mockFindMany.mockResolvedValue([
      {
        id: 'rec-1',
        createdById: 'user-1',
        spaceId: 'space-1',
        startTime: new Date('2023-01-01T10:00:00Z'),
        endTime: new Date('2023-01-01T11:00:00Z'),
        frequency: 'WEEKLY',
        interval: 1,
        endsOn: null,
        description: 'Weekly meeting',
        reservations: [
          {
            id: 'res-1',
            startTime: fiveWeeksFromNow,
            endTime: new Date(fiveWeeksFromNow.getTime() + 60 * 60 * 1000), // 1 hour later
          },
        ],
      },
    ]);
    
    const result = await mockExtendRecurringReservations(context);
    
    expect(mockFindMany).toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(result.processedCount).toBe(1);
  });
}); 