# Recurring Reservations

This directory contains the implementation of recurring reservations functionality for BlockSpot.

## File Structure

- `recurring-reservations-index.ts`: Main entry point that exports all recurring reservation operations
- `recurring-reservations-operations.ts`: Core operations for creating, canceling, and extending recurring reservations
- `single-occurrence-operations.ts`: Operations for modifying single occurrences of a recurring reservation
- `update-recurring-reservation.ts`: Operations for updating a recurring reservation series
- `recurring-reservations.ts`: Helper functions for recurring reservations

## Key Features

### 1. Creating Recurring Reservations

The `createRecurringReservation` function creates a recurring reservation series and generates its occurrences. It validates that the organization allows recurring reservations, checks for conflicts, and creates the individual reservation occurrences.

### 2. Extending Recurring Reservations

The `extendRecurringReservations` function is designed to be run as a scheduled job to generate more occurrences for active recurring reservations. It looks ahead 4 weeks and generates new occurrences if needed.

### 3. Modifying Single Occurrences

The `modifySingleOccurrence` function allows modifying a single occurrence of a recurring reservation without affecting the rest of the series. It marks the occurrence as an exception to the standard pattern.

### 4. Updating Recurring Reservations

The `updateRecurringReservation` function updates a recurring reservation series and regenerates future occurrences. It can update the frequency, interval, end date, and other properties of the series.

### 5. Canceling Recurring Reservations

The `cancelRecurringReservation` function cancels an entire recurring reservation series by marking all occurrences as canceled.

The `cancelSingleOccurrence` function cancels a single occurrence of a recurring reservation.

## Database Schema

The recurring reservations functionality uses the following models:

- `RecurringReservation`: Represents a recurring reservation series
- `Reservation`: Represents an individual occurrence of a recurring reservation
  - Has a `recurringReservationId` field that links it to the series
  - Has an `isException` field that indicates if it has been modified from the standard pattern

## Scheduled Job

The `extendRecurringReservationsJob` is scheduled to run daily at midnight to ensure that recurring reservations always have occurrences generated for the next few weeks.

## Usage Examples

```typescript
// Create a recurring reservation
const recurringReservation = await createRecurringReservation({
  spaceId: 'space-id',
  organizationId: 'org-id',
  startTime: new Date('2023-01-01T10:00:00Z'),
  endTime: new Date('2023-01-01T11:00:00Z'),
  frequency: 'weekly',
  interval: 1,
  endsOn: new Date('2023-12-31T23:59:59Z')
}, context);

// Modify a single occurrence
const modifiedOccurrence = await modifySingleOccurrence({
  reservationId: 'occurrence-id',
  startTime: new Date('2023-01-08T11:00:00Z'), // Changed time
  endTime: new Date('2023-01-08T12:00:00Z'),
  description: 'Modified occurrence'
}, context);

// Update a recurring reservation
const updatedRecurringReservation = await updateRecurringReservation({
  id: 'recurring-reservation-id',
  frequency: 'weekly',
  interval: 2, // Changed to every 2 weeks
  preservePastOccurrences: true
}, context);

// Cancel a recurring reservation
await cancelRecurringReservation({
  id: 'recurring-reservation-id'
}, context);

// Cancel a single occurrence
await cancelSingleOccurrence({
  reservationId: 'occurrence-id'
}, context);
``` 