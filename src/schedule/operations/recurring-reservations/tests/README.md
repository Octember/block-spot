# Recurring Reservations Tests

This directory contains tests for the recurring reservations functionality.

## Running the Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm run test

# Run only recurring reservations tests
npm run test:recurring

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Files

- `extend-recurring-reservations.spec.ts` - Tests for extending recurring reservations
- `modify-single-occurrence.spec.ts` - Tests for modifying a single occurrence
- `update-recurring-reservation.spec.ts` - Tests for updating recurring reservations
- `cancel-recurring-reservation.spec.ts` - Tests for canceling recurring reservations (both entire series and single occurrences)
- `create-recurring-reservation.spec.ts` - Tests for creating recurring reservations
- `get-recurring-reservation.spec.ts` - Tests for retrieving recurring reservations

## Test Structure

Each test file follows a similar structure:

1. **Mocking the function being tested** - We use Vitest's mocking capabilities to mock the function being tested.
2. **Mocking the PrismaClient** - We mock the Prisma client and its methods to avoid database calls during tests.
3. **Setting up a test context** - We create a context object with a user and the mocked entities.
4. **Implementing a mock version of the function** - We provide a mock implementation of the function to simulate its behavior.
5. **Writing test cases** - We write test cases for successful operations and error scenarios.

## Test Coverage

The tests cover various scenarios including:

- Successful operations (creating, updating, canceling, etc.)
- Error handling (not found, unauthorized, validation errors)
- Different parameter combinations (daily vs. weekly frequency, with/without end dates)

## Adding New Tests

When adding new tests, follow these guidelines:

1. Create a new file with the `.spec.ts` extension
2. Follow the existing test structure
3. Mock all external dependencies
4. Test both success and error cases
5. Run the tests to ensure they pass

## Cancellation Functionality

The cancellation functionality provides two main operations:

1. **Cancel Single Occurrence** - Allows canceling just one instance of a recurring reservation series
   - Marks the specific reservation as CANCELLED
   - Sets the isException flag to true to indicate it's been modified from the series pattern
   - Keeps all other occurrences intact

2. **Cancel Entire Series** - Cancels the entire recurring reservation series
   - Updates the recurring reservation record to indicate cancellation
   - Cancels all future occurrences (sets their status to CANCELLED)
   - Past occurrences remain unchanged for historical record-keeping

These operations can be used in the client code by importing the actions from Wasp:

```typescript
import { useAction } from 'wasp/client/operations';
import { cancelRecurringReservation, cancelSingleOccurrence } from 'wasp/actions';

// Later in your component:
const cancelRecurringReservationFn = useAction(cancelRecurringReservation);
const cancelSingleOccurrenceFn = useAction(cancelSingleOccurrence);

// To cancel an entire series:
await cancelRecurringReservationFn({ id: recurringReservationId });

// To cancel a single occurrence:
await cancelSingleOccurrenceFn({ reservationId: occurrenceId });
``` 