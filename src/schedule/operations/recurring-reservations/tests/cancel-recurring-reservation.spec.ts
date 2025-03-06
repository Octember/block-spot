import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cancelRecurringReservation, cancelSingleOccurrence } from '../cancel-recurring-reservation';
import { HttpError } from 'wasp/server';

// Mock data
const mockUser = { id: 'user-1', email: 'test@example.com' };
const mockRecurringReservation = {
  id: 'rec-1',
  userId: 'user-1',
  startTime: new Date('2023-01-01T10:00:00Z'),
  endTime: new Date('2023-01-01T11:00:00Z'),
  frequency: 'WEEKLY',
  interval: 1,
  description: 'Weekly meeting',
  status: 'ACTIVE',
  spaceId: 'space-1'
};
const mockReservation = {
  id: 'res-1',
  recurringReservationId: 'rec-1',
  startTime: new Date('2023-01-01T10:00:00Z'),
  endTime: new Date('2023-01-01T11:00:00Z'),
  status: 'CONFIRMED'
};

// Mock context
const mockContext = {
  user: mockUser,
  entities: {
    RecurringReservation: {
      findUnique: vi.fn().mockResolvedValue(mockRecurringReservation),
      update: vi.fn().mockResolvedValue({ ...mockRecurringReservation, status: 'CANCELLED' })
    },
    Reservation: {
      findUnique: vi.fn().mockResolvedValue(mockReservation),
      update: vi.fn().mockResolvedValue({ ...mockReservation, status: 'CANCELLED' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    }
  }
};

describe('cancelRecurringReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if user is not authenticated', async () => {
    const contextWithoutUser = { ...mockContext, user: null };
    
    await expect(cancelRecurringReservation({ recurringReservationId: 'rec-1' }, contextWithoutUser as any))
      .rejects
      .toThrow(new HttpError(401, 'You must be logged in to cancel a recurring reservation'));
  });

  it('should throw an error if recurring reservation is not found', async () => {
    const contextWithNotFoundReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        RecurringReservation: {
          ...mockContext.entities.RecurringReservation,
          findUnique: vi.fn().mockResolvedValue(null)
        }
      }
    };
    
    await expect(cancelRecurringReservation({ recurringReservationId: 'non-existent' }, contextWithNotFoundReservation as any))
      .rejects
      .toThrow(new HttpError(404, 'Recurring reservation not found'));
  });

  it('should throw an error if user does not own the recurring reservation', async () => {
    const differentUserReservation = {
      ...mockRecurringReservation,
      userId: 'different-user'
    };
    
    const contextWithDifferentUserReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        RecurringReservation: {
          ...mockContext.entities.RecurringReservation,
          findUnique: vi.fn().mockResolvedValue(differentUserReservation)
        }
      }
    };
    
    await expect(cancelRecurringReservation({ recurringReservationId: 'rec-1' }, contextWithDifferentUserReservation as any))
      .rejects
      .toThrow(new HttpError(403, 'You do not have permission to cancel this recurring reservation'));
  });

  it('should cancel the recurring reservation and all future occurrences', async () => {
    const result = await cancelRecurringReservation({ recurringReservationId: 'rec-1' }, mockContext as any);
    
    expect(mockContext.entities.RecurringReservation.findUnique).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      include: { reservations: true }
    });
    
    expect(mockContext.entities.RecurringReservation.update).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      data: { status: 'CANCELLED' }
    });
    
    expect(mockContext.entities.Reservation.updateMany).toHaveBeenCalledWith({
      where: {
        recurringReservationId: 'rec-1',
        startTime: { gte: expect.any(Date) },
        status: 'CONFIRMED'
      },
      data: { status: 'CANCELLED' }
    });
    
    expect(result).toEqual({ ...mockRecurringReservation, status: 'CANCELLED' });
  });
});

describe('cancelSingleOccurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if user is not authenticated', async () => {
    const contextWithoutUser = { ...mockContext, user: null };
    
    await expect(cancelSingleOccurrence({ recurringReservationId: 'rec-1', reservationId: 'res-1' }, contextWithoutUser as any))
      .rejects
      .toThrow(new HttpError(401, 'You must be logged in to cancel a reservation'));
  });

  it('should throw an error if recurring reservation is not found', async () => {
    const contextWithNotFoundReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        RecurringReservation: {
          ...mockContext.entities.RecurringReservation,
          findUnique: vi.fn().mockResolvedValue(null)
        }
      }
    };
    
    await expect(cancelSingleOccurrence({ recurringReservationId: 'non-existent', reservationId: 'res-1' }, contextWithNotFoundReservation as any))
      .rejects
      .toThrow(new HttpError(404, 'Recurring reservation not found'));
  });

  it('should throw an error if user does not own the recurring reservation', async () => {
    const differentUserReservation = {
      ...mockRecurringReservation,
      userId: 'different-user'
    };
    
    const contextWithDifferentUserReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        RecurringReservation: {
          ...mockContext.entities.RecurringReservation,
          findUnique: vi.fn().mockResolvedValue(differentUserReservation)
        }
      }
    };
    
    await expect(cancelSingleOccurrence({ recurringReservationId: 'rec-1', reservationId: 'res-1' }, contextWithDifferentUserReservation as any))
      .rejects
      .toThrow(new HttpError(403, 'You do not have permission to cancel this reservation'));
  });

  it('should throw an error if reservation is not found', async () => {
    const contextWithNotFoundOccurrence = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        Reservation: {
          ...mockContext.entities.Reservation,
          findUnique: vi.fn().mockResolvedValue(null)
        }
      }
    };
    
    await expect(cancelSingleOccurrence({ recurringReservationId: 'rec-1', reservationId: 'non-existent' }, contextWithNotFoundOccurrence as any))
      .rejects
      .toThrow(new HttpError(404, 'Reservation not found'));
  });

  it('should throw an error if reservation does not belong to the recurring reservation', async () => {
    const differentRecurringReservation = {
      ...mockReservation,
      recurringReservationId: 'different-rec'
    };
    
    const contextWithDifferentRecurringReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        Reservation: {
          ...mockContext.entities.Reservation,
          findUnique: vi.fn().mockResolvedValue(differentRecurringReservation)
        }
      }
    };
    
    await expect(cancelSingleOccurrence({ recurringReservationId: 'rec-1', reservationId: 'res-1' }, contextWithDifferentRecurringReservation as any))
      .rejects
      .toThrow(new HttpError(400, 'Reservation does not belong to the specified recurring reservation'));
  });

  it('should throw an error if reservation is already cancelled', async () => {
    const cancelledReservation = {
      ...mockReservation,
      status: 'CANCELLED'
    };
    
    const contextWithCancelledReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        Reservation: {
          ...mockContext.entities.Reservation,
          findUnique: vi.fn().mockResolvedValue(cancelledReservation)
        }
      }
    };
    
    await expect(cancelSingleOccurrence({ recurringReservationId: 'rec-1', reservationId: 'res-1' }, contextWithCancelledReservation as any))
      .rejects
      .toThrow(new HttpError(400, 'Reservation is already cancelled'));
  });

  it('should throw an error if reservation is in the past', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday
    
    const pastReservation = {
      ...mockReservation,
      startTime: pastDate
    };
    
    const contextWithPastReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        Reservation: {
          ...mockContext.entities.Reservation,
          findUnique: vi.fn().mockResolvedValue(pastReservation)
        }
      }
    };
    
    await expect(cancelSingleOccurrence({ recurringReservationId: 'rec-1', reservationId: 'res-1' }, contextWithPastReservation as any))
      .rejects
      .toThrow(new HttpError(400, 'Cannot cancel a past reservation'));
  });

  it('should cancel the single occurrence', async () => {
    // Set the reservation date to the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    
    const futureReservation = {
      ...mockReservation,
      startTime: futureDate
    };
    
    const contextWithFutureReservation = {
      ...mockContext,
      entities: {
        ...mockContext.entities,
        Reservation: {
          ...mockContext.entities.Reservation,
          findUnique: vi.fn().mockResolvedValue(futureReservation)
        }
      }
    };
    
    const result = await cancelSingleOccurrence({ recurringReservationId: 'rec-1', reservationId: 'res-1' }, contextWithFutureReservation as any);
    
    expect(contextWithFutureReservation.entities.RecurringReservation.findUnique).toHaveBeenCalledWith({
      where: { id: 'rec-1' }
    });
    
    expect(contextWithFutureReservation.entities.Reservation.findUnique).toHaveBeenCalledWith({
      where: { id: 'res-1' }
    });
    
    expect(contextWithFutureReservation.entities.Reservation.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { status: 'CANCELLED' }
    });
    
    expect(result).toEqual({ ...mockReservation, status: 'CANCELLED' });
  });
}); 