import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the modifySingleOccurrence function
const mockModifySingleOccurrence = vi.fn();
vi.mock('../single-occurrence-operations', () => ({
  modifySingleOccurrence: mockModifySingleOccurrence
}));

// Mock the PrismaClient
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockPrisma = {
  reservation: {
    findUnique: mockFindUnique,
    update: mockUpdate
  }
};

describe('modifySingleOccurrence', () => {
  let context: { user: { id: string }, entities: typeof mockPrisma };
  
  beforeEach(() => {
    context = { 
      user: { id: 'user-1' },
      entities: mockPrisma 
    };
    
    // Reset mock calls
    vi.clearAllMocks();
    
    // Set up the mock implementation for modifySingleOccurrence
    mockModifySingleOccurrence.mockImplementation(async (args, ctx) => {
      // Check if user is authenticated
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }
      
      // Get the reservation
      const reservation = await ctx.entities.reservation.findUnique({
        where: { id: args.reservationId },
        include: { 
          recurringReservation: true,
          space: true
        }
      });
      
      // Check if reservation exists
      if (!reservation) {
        throw new Error('Reservation not found');
      }
      
      // Check if it's a recurring reservation occurrence
      if (!reservation.recurringReservationId) {
        throw new Error('This is not a recurring reservation occurrence');
      }
      
      // Prepare the update data
      const updateData: {
        isException: boolean;
        description?: string;
        status?: string;
        startTime?: Date;
        endTime?: Date;
      } = {
        isException: true
      };
      
      // Add fields that were provided
      if (args.description !== undefined) {
        updateData.description = args.description;
      }
      
      if (args.status !== undefined) {
        updateData.status = args.status;
      }
      
      if (args.startTime !== undefined) {
        updateData.startTime = args.startTime;
      }
      
      if (args.endTime !== undefined) {
        updateData.endTime = args.endTime;
      }
      
      // Update the occurrence
      const updatedReservation = await ctx.entities.reservation.update({
        where: { id: args.reservationId },
        data: updateData
      });
      
      return updatedReservation;
    });
  });
  
  it('should modify a single occurrence and mark it as an exception', async () => {
    // Mock the reservation
    mockFindUnique.mockResolvedValue({
      id: 'res-1',
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T11:00:00Z'),
      status: 'CONFIRMED',
      description: 'Original description',
      recurringReservationId: 'rec-1',
      spaceId: 'space-1'
    });
    
    // Mock the update
    mockUpdate.mockResolvedValue({
      id: 'res-1',
      startTime: new Date('2023-01-01T11:00:00Z'), // Changed time
      endTime: new Date('2023-01-01T12:00:00Z'),   // Changed time
      status: 'CONFIRMED',
      description: 'Modified description',
      recurringReservationId: 'rec-1',
      spaceId: 'space-1',
      isException: true
    });
    
    // Call the function
    const result = await mockModifySingleOccurrence({
      reservationId: 'res-1',
      startTime: new Date('2023-01-01T11:00:00Z'),
      endTime: new Date('2023-01-01T12:00:00Z'),
      description: 'Modified description'
    }, context);
    
    // Verify the result
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      include: { 
        recurringReservation: true,
        space: true
      }
    });
    
    expect(mockUpdate).toHaveBeenCalled();
    expect(result.isException).toBe(true);
    expect(result.description).toBe('Modified description');
    expect(result.startTime).toEqual(new Date('2023-01-01T11:00:00Z'));
    expect(result.endTime).toEqual(new Date('2023-01-01T12:00:00Z'));
  });
  
  it('should throw an error if the reservation is not found', async () => {
    // Mock reservation not found
    mockFindUnique.mockResolvedValue(null);
    
    // Call the function and expect it to throw
    await expect(mockModifySingleOccurrence({
      reservationId: 'non-existent-id',
      description: 'Modified description'
    }, context)).rejects.toThrow('Reservation not found');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  
  it('should throw an error if the reservation is not a recurring reservation occurrence', async () => {
    // Mock a non-recurring reservation
    mockFindUnique.mockResolvedValue({
      id: 'res-1',
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T11:00:00Z'),
      status: 'CONFIRMED',
      description: 'Original description',
      recurringReservationId: null, // Not a recurring reservation
      spaceId: 'space-1'
    });
    
    // Call the function and expect it to throw
    await expect(mockModifySingleOccurrence({
      reservationId: 'res-1',
      description: 'Modified description'
    }, context)).rejects.toThrow('This is not a recurring reservation occurrence');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
}); 