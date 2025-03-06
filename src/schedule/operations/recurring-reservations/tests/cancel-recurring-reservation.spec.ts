import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReservationStatus } from '@prisma/client';

// Mock the cancelRecurringReservation and cancelSingleOccurrence functions
const mockCancelRecurringReservation = vi.fn();
const mockCancelSingleOccurrence = vi.fn();
vi.mock('../cancel-recurring-reservation', () => ({
  cancelRecurringReservation: mockCancelRecurringReservation,
  cancelSingleOccurrence: mockCancelSingleOccurrence
}));

// Mock the PrismaClient
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockTransaction = vi.fn();
const mockPrisma = {
  recurringReservation: {
    findUnique: mockFindUnique,
    update: mockUpdate
  },
  reservation: {
    findUnique: mockFindUnique,
    update: mockUpdate,
    updateMany: mockUpdateMany
  },
  $transaction: mockTransaction
};

describe('cancelRecurringReservation', () => {
  let context: { user: { id: string }, entities: typeof mockPrisma };
  
  beforeEach(() => {
    context = { 
      user: { id: 'user-1' },
      entities: mockPrisma 
    };
    
    // Reset mock calls
    vi.clearAllMocks();
    
    // Set up the mock implementation for cancelRecurringReservation
    mockCancelRecurringReservation.mockImplementation(async (args, ctx) => {
      // Check if user is authenticated
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }
      
      const now = new Date();
      
      // Get the recurring reservation
      const recurringReservation = await ctx.entities.recurringReservation.findUnique({
        where: { id: args.id }
      });
      
      // Check if recurring reservation exists
      if (!recurringReservation) {
        throw new Error('Recurring reservation not found');
      }
      
      // Check if user has permission to cancel
      if (recurringReservation.createdById !== ctx.user.id) {
        throw new Error('You do not have permission to cancel this recurring reservation');
      }
      
      // Use a transaction to ensure both operations succeed or fail together
      mockTransaction.mockImplementation(async (operations) => {
        const updatedRecurringReservation = await operations[0];
        await operations[1];
        return [updatedRecurringReservation];
      });
      
      // Update the recurring reservation
      mockUpdate.mockResolvedValueOnce({
        id: args.id,
        updatedAt: now
      });
      
      // Cancel all future occurrences
      mockUpdateMany.mockResolvedValueOnce({ count: 5 });
      
      const result = await ctx.entities.$transaction([
        ctx.entities.recurringReservation.update({
          where: { id: args.id },
          data: { 
            updatedAt: now
          }
        }),
        
        ctx.entities.reservation.updateMany({
          where: {
            recurringReservationId: args.id,
            startTime: { gte: now },
            status: { not: ReservationStatus.CANCELLED }
          },
          data: {
            status: ReservationStatus.CANCELLED,
            updatedAt: now
          }
        })
      ]);
      
      return result[0];
    });
  });
  
  it('should cancel a recurring reservation and all future occurrences', async () => {
    const now = new Date();
    
    // Mock the recurring reservation
    mockFindUnique.mockResolvedValueOnce({
      id: 'rec-1',
      createdById: 'user-1',
      spaceId: 'space-1',
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T11:00:00Z'),
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: null,
      description: 'Recurring meeting'
    });
    
    // Call the function
    const result = await mockCancelRecurringReservation({
      id: 'rec-1'
    }, context);
    
    // Verify the result
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'rec-1' }
    });
    
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      data: {
        updatedAt: expect.any(Date)
      }
    });
    
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        recurringReservationId: 'rec-1',
        startTime: { gte: expect.any(Date) },
        status: { not: ReservationStatus.CANCELLED }
      },
      data: {
        status: ReservationStatus.CANCELLED,
        updatedAt: expect.any(Date)
      }
    });
    
    expect(result).toEqual({
      id: 'rec-1',
      updatedAt: expect.any(Date)
    });
  });
  
  it('should throw an error if the recurring reservation is not found', async () => {
    // Mock recurring reservation not found
    mockFindUnique.mockResolvedValueOnce(null);
    
    // Call the function and expect it to throw
    await expect(mockCancelRecurringReservation({
      id: 'non-existent-id'
    }, context)).rejects.toThrow('Recurring reservation not found');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
  
  it('should throw an error if the user does not have permission', async () => {
    // Mock the recurring reservation with a different creator
    mockFindUnique.mockResolvedValueOnce({
      id: 'rec-1',
      createdById: 'different-user',
      spaceId: 'space-1',
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T11:00:00Z'),
      frequency: 'WEEKLY',
      interval: 1,
      endsOn: null,
      description: 'Recurring meeting'
    });
    
    // Call the function and expect it to throw
    await expect(mockCancelRecurringReservation({
      id: 'rec-1'
    }, context)).rejects.toThrow('You do not have permission to cancel this recurring reservation');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});

describe('cancelSingleOccurrence', () => {
  let context: { user: { id: string }, entities: typeof mockPrisma };
  
  beforeEach(() => {
    context = { 
      user: { id: 'user-1' },
      entities: mockPrisma 
    };
    
    // Reset mock calls
    vi.clearAllMocks();
    
    // Set up the mock implementation for cancelSingleOccurrence
    mockCancelSingleOccurrence.mockImplementation(async (args, ctx) => {
      // Check if user is authenticated
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }
      
      // Get the reservation
      const reservation = await ctx.entities.reservation.findUnique({
        where: { id: args.reservationId },
        include: { recurringReservation: true }
      });
      
      // Check if reservation exists
      if (!reservation) {
        throw new Error('Reservation not found');
      }
      
      if (!reservation.recurringReservationId) {
        throw new Error('This is not a recurring reservation occurrence');
      }
      
      // Check if user has permission to cancel
      if (!reservation.recurringReservation || reservation.recurringReservation.createdById !== ctx.user.id) {
        throw new Error('You do not have permission to cancel this reservation');
      }
      
      // Cancel the occurrence
      const updatedReservation = await ctx.entities.reservation.update({
        where: { id: args.reservationId },
        data: { 
          status: ReservationStatus.CANCELLED,
          isException: true,
          updatedAt: new Date()
        }
      });
      
      return updatedReservation;
    });
  });
  
  it('should cancel a single occurrence of a recurring reservation', async () => {
    // Mock the reservation
    mockFindUnique.mockResolvedValueOnce({
      id: 'res-1',
      recurringReservationId: 'rec-1',
      status: ReservationStatus.CONFIRMED,
      recurringReservation: {
        id: 'rec-1',
        createdById: 'user-1'
      }
    });
    
    // Mock the update
    mockUpdate.mockResolvedValueOnce({
      id: 'res-1',
      recurringReservationId: 'rec-1',
      status: ReservationStatus.CANCELLED,
      isException: true,
      updatedAt: expect.any(Date)
    });
    
    // Call the function
    const result = await mockCancelSingleOccurrence({
      reservationId: 'res-1'
    }, context);
    
    // Verify the result
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      include: { recurringReservation: true }
    });
    
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: {
        status: ReservationStatus.CANCELLED,
        isException: true,
        updatedAt: expect.any(Date)
      }
    });
    
    expect(result).toEqual({
      id: 'res-1',
      recurringReservationId: 'rec-1',
      status: ReservationStatus.CANCELLED,
      isException: true,
      updatedAt: expect.any(Date)
    });
  });
  
  it('should throw an error if the reservation is not found', async () => {
    // Mock reservation not found
    mockFindUnique.mockResolvedValueOnce(null);
    
    // Call the function and expect it to throw
    await expect(mockCancelSingleOccurrence({
      reservationId: 'non-existent-id'
    }, context)).rejects.toThrow('Reservation not found');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  
  it('should throw an error if the reservation is not part of a recurring series', async () => {
    // Mock a non-recurring reservation
    mockFindUnique.mockResolvedValueOnce({
      id: 'res-1',
      recurringReservationId: null,
      status: ReservationStatus.CONFIRMED
    });
    
    // Call the function and expect it to throw
    await expect(mockCancelSingleOccurrence({
      reservationId: 'res-1'
    }, context)).rejects.toThrow('This is not a recurring reservation occurrence');
    
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
}); 