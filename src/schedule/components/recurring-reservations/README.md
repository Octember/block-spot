# Recurring Reservations Cancellation Components

This directory contains components for canceling recurring reservations in the BlockSpot application.

## Components

### CancelRecurringReservation.tsx

This file provides hooks and button components for canceling recurring reservations:

1. **useCancelRecurringReservation** - A hook for canceling an entire recurring reservation series
2. **useCancelSingleOccurrence** - A hook for canceling a single occurrence of a recurring reservation
3. **CancelRecurringReservationButton** - A button component for canceling a recurring reservation series
4. **CancelSingleOccurrenceButton** - A button component for canceling a single occurrence of a recurring reservation

## Usage

### Hooks

```tsx
import { useCancelRecurringReservation, useCancelSingleOccurrence } from './CancelRecurringReservation';

// For canceling an entire series
const { cancelRecurringReservation, isLoading } = useCancelRecurringReservation();

// Call this function when you want to cancel the series
const handleCancelSeries = () => {
  cancelRecurringReservation({
    recurringReservationId: 'your-recurring-reservation-id',
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  });
};

// For canceling a single occurrence
const { cancelSingleOccurrence, isLoading: isCancellingOccurrence } = useCancelSingleOccurrence();

// Call this function when you want to cancel a single occurrence
const handleCancelOccurrence = () => {
  cancelSingleOccurrence({
    recurringReservationId: 'your-recurring-reservation-id',
    reservationId: 'your-reservation-id',
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  });
};
```

### Button Components

```tsx
import { 
  CancelRecurringReservationButton, 
  CancelSingleOccurrenceButton 
} from './CancelRecurringReservation';

// In your component
return (
  <div>
    {/* Button to cancel the entire series */}
    <CancelRecurringReservationButton
      recurringReservationId="your-recurring-reservation-id"
      onSuccess={() => {
        // Handle success
      }}
      onError={(error) => {
        // Handle error
      }}
    />
    
    {/* Button to cancel a single occurrence */}
    <CancelSingleOccurrenceButton
      recurringReservationId="your-recurring-reservation-id"
      reservationId="your-reservation-id"
      onSuccess={() => {
        // Handle success
      }}
      onError={(error) => {
        // Handle error
      }}
    />
  </div>
);
```

## Props

### CancelRecurringReservationButton Props

| Prop | Type | Description |
|------|------|-------------|
| recurringReservationId | string | The ID of the recurring reservation series to cancel |
| onSuccess | () => void | Optional callback function to run after successful cancellation |
| onError | (error: Error) => void | Optional callback function to run if cancellation fails |
| className | string | Optional CSS class to apply to the button |
| children | React.ReactNode | Optional content to render inside the button |

### CancelSingleOccurrenceButton Props

| Prop | Type | Description |
|------|------|-------------|
| recurringReservationId | string | The ID of the recurring reservation series |
| reservationId | string | The ID of the specific occurrence to cancel |
| onSuccess | () => void | Optional callback function to run after successful cancellation |
| onError | (error: Error) => void | Optional callback function to run if cancellation fails |
| className | string | Optional CSS class to apply to the button |
| children | React.ReactNode | Optional content to render inside the button |

## Backend Integration

These components integrate with the following Wasp actions:

- `cancelRecurringReservation` - Cancels an entire recurring reservation series
- `cancelSingleOccurrence` - Cancels a single occurrence of a recurring reservation

Both actions are defined in the main.wasp file and implemented in the `src/schedule/operations/recurring-reservations/cancel-recurring-reservation.ts` file. 