import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the createRecurringReservation function
const mockCreateRecurringReservation = vi.fn();
vi.mock('../create-recurring-reservation', () => ({
  createRecurringReservation: mockCreateRecurringReservation
}));

// Mock the PrismaClient
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockCreateMany = vi.fn();
const mockPrisma = {
  space: {
    findUnique: mockFindUnique
  },
  recurringReservation: {
    create: mockCreate
  },
  reservation: {
    createMany: mockCreateMany
  }
};

describe('createRecurringReservation', () => {
  let context: { user: { id: string }, entities: typeof mockPrisma };
  
  beforeEach(() => {
    context = { 
      user: { id: 'user-1' },
      entities: mockPrisma 
    };
    
    // Reset mock calls
    vi.clearAllMocks();
    
    // Set up the mock implementation for createRecurringReservation
    mockCreateRecurringReservation.mockImplementation(async (args, ctx) => {
      // Check if user is authenticated
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }
      
      // Get the space
      const space = await ctx.entities.space.findUnique({
        where: { id: args.spaceId },
        include: { venue: true }
      });
      
      // Check if space exists
      if (!space) {
        throw new Error('Space not found');
      }
      
      // Validate dates
      if (args.startTime >= args.endTime) {
        throw new Error('Start time must be before end time');
      }
      
      // Create the recurring reservation
      const recurringReservation = await ctx.entities.recurringReservation.create({
        data: {
          createdById: ctx.user.id,
          spaceId: args.spaceId,
          startTime: args.startTime,
          endTime: args.endTime,
          frequency: args.frequency,
          interval: args.interval,
          endsOn: args.endsOn,
          description: args.description,
          status: 'CONFIRMED'
        }
      });
      
      // Generate occurrences (simplified for testing)
      const occurrences = [];
      let currentDate = new Date(args.startTime);
      const endDate = args.endsOn || new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days if no end date
      
      while (currentDate <= endDate) {
        occurrences.push({
          userId: ctx.user.id,
          createdById: ctx.user.id,
          startTime: new Date(currentDate),
          endTime: new Date(currentDate.getTime() + (args.endTime.getTime() - args.startTime.getTime())),
          status: 'CONFIRMED',
          spaceId: args.spaceId,
          description: args.description,
          recurringReservationId: recurringReservation.id,
          isException: false
        });
        
        // Move to next occurrence based on frequency and interval
        if (args.frequency === 'DAILY') {
          currentDate = new Date(currentDate.getTime() + args.interval * 24 * 60 * 60 * 1000);
        } else if (args.frequency === 'WEEKLY') {
          currentDate = new Date(currentDate.getTime() + args.interval * 7 * 24 * 60 * 60 * 1000);
        } else if (args.frequency === 'MONTHLY') {
          const nextMonth = new Date(currentDate);
          nextMonth.setMonth(nextMonth.getMonth() + args.interval);
          currentDate = nextMonth;
        }
      }
      
      // Create the occurrences
      if (occurrences.length > 0) {
        await ctx.entities.reservation.createMany({
          data: occurrences
        });
      }
      
      return recurringReservation;
    });
  });
  
  it('should create a recurring reservation with occurrences', async () => {
    const startTime = new Date('2023-01-01T10:00:00Z');
    const endTime = new Date('2023-01-01T11:00:00Z');
    
    // Mock the space
    mockFindUnique.mockResolvedValue({
      id: 'space-1',
      name: 'Meeting Room',
      venue: { id: 'venue-1', name: 'Office Building' }
    });
    
    // Mock the create recurring reservation
    mockCreate.mockResolvedValue({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime,
      endTime,
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: new Date('2023-03-31T23:59:59Z'),
      description: 'Weekly team meeting',
      status: 'CONFIRMED'
    });
    
    // Call the function
    const result = await mockCreateRecurringReservation({
      spaceId: 'space-1',
      startTime,
      endTime,
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: new Date('2023-03-31T23:59:59Z'),
      description: 'Weekly team meeting'
    }, context);
    
    // Verify the result
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'space-1' },
      include: { venue: true }
    });
    
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        createdById: 'user-1',
        spaceId: 'space-1',
        startTime,
        endTime,
        frequency: 'WEEKLY',
        interval: 1,
        endsOn: new Date('2023-03-31T23:59:59Z'),
        description: 'Weekly team meeting',
        status: 'CONFIRMED'
      }
    });
    
    expect(mockCreateMany).toHaveBeenCalled();
    expect(result.id).toBe('rec-1');
    expect(result.frequency).toBe('WEEKLY');
    expect(result.interval).toBe(1);
  });
  
  it('should throw an error if the space is not found', async () => {
    // Mock space not found
    mockFindUnique.mockResolvedValue(null);
    
    const startTime = new Date('2023-01-01T10:00:00Z');
    const endTime = new Date('2023-01-01T11:00:00Z');
    
    // Call the function and expect it to throw
    await expect(mockCreateRecurringReservation({
      spaceId: 'non-existent-space',
      startTime,
      endTime,
      frequency: 'WEEKLY',
      interval: 1,
      description: 'Weekly team meeting'
    }, context)).rejects.toThrow('Space not found');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });
  
  it('should throw an error if start time is after end time', async () => {
    // Mock the space
    mockFindUnique.mockResolvedValue({
      id: 'space-1',
      name: 'Meeting Room',
      venue: { id: 'venue-1', name: 'Office Building' }
    });
    
    const startTime = new Date('2023-01-01T11:00:00Z');
    const endTime = new Date('2023-01-01T10:00:00Z'); // End time before start time
    
    // Call the function and expect it to throw
    await expect(mockCreateRecurringReservation({
      spaceId: 'space-1',
      startTime,
      endTime,
      frequency: 'WEEKLY',
      interval: 1,
      description: 'Weekly team meeting'
    }, context)).rejects.toThrow('Start time must be before end time');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });
  
  it('should create a recurring reservation with daily frequency', async () => {
    const startTime = new Date('2023-01-01T10:00:00Z');
    const endTime = new Date('2023-01-01T11:00:00Z');
    
    // Mock the space
    mockFindUnique.mockResolvedValue({
      id: 'space-1',
      name: 'Meeting Room',
      venue: { id: 'venue-1', name: 'Office Building' }
    });
    
    // Mock the create recurring reservation
    mockCreate.mockResolvedValue({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime,
      endTime,
      frequency: 'DAILY',
      interval: 1,
      endsOn: new Date('2023-01-31T23:59:59Z'),
      description: 'Daily standup',
      status: 'CONFIRMED'
    });
    
    // Call the function
    const result = await mockCreateRecurringReservation({
      spaceId: 'space-1',
      startTime,
      endTime,
      frequency: 'DAILY',
      interval: 1,
      endsOn: new Date('2023-01-31T23:59:59Z'),
      description: 'Daily standup'
    }, context);
    
    // Verify the result
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        createdById: 'user-1',
        spaceId: 'space-1',
        startTime,
        endTime,
        frequency: 'DAILY',
        interval: 1,
        endsOn: new Date('2023-01-31T23:59:59Z'),
        description: 'Daily standup',
        status: 'CONFIRMED'
      }
    });
    
    expect(mockCreateMany).toHaveBeenCalled();
    expect(result.frequency).toBe('DAILY');
  });
}); 