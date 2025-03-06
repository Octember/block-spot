import React, { useState } from 'react';
import { cancelRecurringReservation, cancelSingleOccurrence, useAction } from 'wasp/client/operations';

type CancelRecurringReservationProps = {
  recurringReservationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type CancelSingleOccurrenceProps = {
  recurringReservationId: string;
  reservationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Hook for canceling an entire recurring reservation series
 */
export const useCancelRecurringReservation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const cancelRecurringReservationFn = useAction(cancelRecurringReservation);

  const cancel = async ({
    recurringReservationId,
    onSuccess,
    onError
  }: CancelRecurringReservationProps) => {
    setIsLoading(true);
    try {
      await cancelRecurringReservationFn({
        recurringReservationId
      });
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelRecurringReservation: cancel,
    isLoading
  };
};

/**
 * Hook for canceling a single occurrence of a recurring reservation
 */
export const useCancelSingleOccurrence = () => {
  const [isLoading, setIsLoading] = useState(false);
  const cancelSingleOccurrenceFn = useAction(cancelSingleOccurrence);

  const cancel = async ({
    recurringReservationId,
    reservationId,
    onSuccess,
    onError
  }: CancelSingleOccurrenceProps) => {
    setIsLoading(true);
    try {
      await cancelSingleOccurrenceFn({
        recurringReservationId,
        reservationId
      });
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelSingleOccurrence: cancel,
    isLoading
  };
};

/**
 * Button component for canceling a recurring reservation series
 */
export const CancelRecurringReservationButton: React.FC<{
  recurringReservationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}> = ({
  recurringReservationId,
  onSuccess,
  onError,
  className = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
  children = "Cancel Series"
}) => {
    const { cancelRecurringReservation, isLoading } = useCancelRecurringReservation();

    const handleClick = () => {
      if (window.confirm("Are you sure you want to cancel this entire reservation series? This action cannot be undone.")) {
        cancelRecurringReservation({
          recurringReservationId,
          onSuccess,
          onError
        });
      }
    };

    return (
      <button
        className={className}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2"></span>
        ) : null}
        {children}
      </button>
    );
  };

/**
 * Button component for canceling a single occurrence of a recurring reservation
 */
export const CancelSingleOccurrenceButton: React.FC<{
  recurringReservationId: string;
  reservationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}> = ({
  recurringReservationId,
  reservationId,
  onSuccess,
  onError,
  className = "inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
  children = "Cancel"
}) => {
    const { cancelSingleOccurrence, isLoading } = useCancelSingleOccurrence();

    const handleClick = () => {
      if (window.confirm("Are you sure you want to cancel this occurrence? This action cannot be undone.")) {
        cancelSingleOccurrence({
          recurringReservationId,
          reservationId,
          onSuccess,
          onError
        });
      }
    };

    return (
      <button
        className={className}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-1"></span>
        ) : null}
        {children}
      </button>
    );
  }; 