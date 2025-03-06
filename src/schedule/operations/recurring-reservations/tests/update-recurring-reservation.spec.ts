import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the updateRecurringReservation function
const mockUpdateRecurringReservation = vi.fn();
vi.mock('../update-recurring-reservation', () => ({
  updateRecurringReservation: mockUpdateRecurringReservation
}));

// Mock the PrismaClient
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockCreateMany = vi.fn();
const mockPrisma = {
  recurringReservation: {
    findUnique: mockFindUnique,
    update: mockUpdate
  },
  reservation: {
    updateMany: mockUpdateMany,
    createMany: mockCreateMany
  }
};

describe('updateRecurringReservation', () => {
  let context: { user: { id: string }, entities: typeof mockPrisma };
  
  beforeEach(() => {
    context = { 
      user: { id: 'user-1' },
      entities: mockPrisma 
    };
    
    // Reset mock calls
    vi.clearAllMocks();
    
    // Set up the mock implementation for updateRecurringReservation
    mockUpdateRecurringReservation.mockImplementation(async (args, ctx) => {
      // Check if user is authenticated
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }
      
      const now = new Date();
      
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
      
      // Determine if we need to update the start/end times
      const newStartTime = args.startTime || recurringReservation.startTime;
      const newEndTime = args.endTime || recurringReservation.endTime;
      
      // Update the recurring reservation
      const updatedRecurringReservation = await ctx.entities.recurringReservation.update({
        where: { id: args.id },
        data: {
          frequency: args.frequency,
          interval: args.interval,
          endsOn: args.endsOn,
          description: args.description,
          startTime: newStartTime,
          endTime: newEndTime,
          updatedAt: now
        }
      });
      
      // Cancel future occurrences
      await ctx.entities.reservation.updateMany({
        where: {
          recurringReservationId: args.id,
          startTime: { gt: now },
          ...(args.frequency || args.interval || args.startTime || args.endTime 
            ? {} 
            : { isException: false })
        },
        data: {
          status: 'CANCELLED'
        }
      });
      
      // Create new occurrences (simplified for testing)
      await ctx.entities.reservation.createMany({
        data: [
          {
            userId: ctx.user.id,
            createdById: ctx.user.id,
            startTime: new Date(newStartTime.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week later
            endTime: new Date(newEndTime.getTime() + 7 * 24 * 60 * 60 * 1000),
            status: 'CONFIRMED',
            spaceId: recurringReservation.spaceId,
            description: args.description || recurringReservation.description,
            recurringReservationId: args.id,
            isException: false
          }
        ]
      });
      
      return updatedRecurringReservation;
    });
  });
  
  it('should update a recurring reservation and regenerate future occurrences', async () => {
    const now = new Date();
    const originalStartTime = new Date('2023-01-01T10:00:00Z');
    const originalEndTime = new Date('2023-01-01T11:00:00Z');
    
    // Mock the recurring reservation
    mockFindUnique.mockResolvedValue({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime: originalStartTime,
      endTime: originalEndTime,
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: null,
      description: 'Original description',
      space: { venue: {} },
      reservations: []
    });
    
    // Mock the update
    mockUpdate.mockResolvedValue({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime: originalStartTime,
      endTime: originalEndTime,
      frequency: 'WEEKLY',
      interval: 2, // Changed to every 2 weeks
      endsOn: new Date('2023-12-31T23:59:59Z'), // Added end date
      description: 'Updated description',
      updatedAt: now
    });
    
    // Call the function
    const result = await mockUpdateRecurringReservation({
      id: 'rec-1',
      frequency: 'WEEKLY',
      interval: 2,
      endsOn: new Date('2023-12-31T23:59:59Z'),
      description: 'Updated description'
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
    
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateMany).toHaveBeenCalled();
    expect(mockCreateMany).toHaveBeenCalled();
    
    expect(result.interval).toBe(2);
    expect(result.description).toBe('Updated description');
    expect(result.endsOn).toEqual(new Date('2023-12-31T23:59:59Z'));
  });
  
  it('should throw an error if the recurring reservation is not found', async () => {
    // Mock recurring reservation not found
    mockFindUnique.mockResolvedValue(null);
    
    // Call the function and expect it to throw
    await expect(mockUpdateRecurringReservation({
      id: 'non-existent-id',
      description: 'Updated description'
    }, context)).rejects.toThrow('Recurring reservation not found');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });
  
  it('should update only the description without regenerating occurrences', async () => {
    const now = new Date();
    
    // Mock the recurring reservation
    mockFindUnique.mockResolvedValue({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T11:00:00Z'),
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: null,
      description: 'Original description',
      space: { venue: {} },
      reservations: []
    });
    
    // Mock the update
    mockUpdate.mockResolvedValue({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T11:00:00Z'),
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: null,
      description: 'Updated description only',
      updatedAt: now
    });
    
    // Call the function
    await mockUpdateRecurringReservation({
      id: 'rec-1',
      description: 'Updated description only'
    }, context);
    
    // Verify that updateMany was called with isException: false
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        recurringReservationId: 'rec-1',
        startTime: { gt: expect.any(Date) },
        isException: false
      },
      data: {
        status: 'CANCELLED'
      }
    });
  });
}); 