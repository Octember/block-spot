# Cursor Memory

## Code Style & Practices

### Filenames

- use dash-case for filenames

### Wasp Operations

1. Never manually type Wasp queries/operations - use them directly:

```typescript
const { data: organizations } = useQuery(getUserOrganizations);
```

2. Let Wasp handle type inference based on operation definitions in `main.wasp`
3. Avoid unnecessary type imports and manual type casting for Wasp operations

### TypeScript

1. Never use `let` - prefer `const` for immutability

### UI & Components

1. Always use Tailwind CSS for styling
2. Use shared components from `src/client/components/`:
   - Button
   - Select
   - Dialog
   - Other common UI elements
3. Maintain consistency by leveraging existing component library

#### Shared Component Usage

1. Modal Component (`src/client/components/modal.tsx`):

   - Use for all confirmation dialogs and forms
   - Supports `heading`, `footer`, and `size` props
   - Handles backdrop and animations automatically

2. Button Component (`src/client/components/button.tsx`):

   - Use for all clickable actions
   - Variants: primary, secondary, tertiary, danger, warning
   - Always provide `ariaLabel` for accessibility
   - Supports icons via `icon` prop

3. Toast Notifications (`src/client/toast.tsx`):
   - Use for all success/error feedback
   - Types: success, error
   - Auto-dismisses after 4 seconds by default
   - Support title and optional description

### Form Handling

1. Use react-hook-form for all forms:

   ```typescript
   const {
     register,
     handleSubmit,
     formState: { isSubmitting },
     reset,
   } = useForm<FormInputs>({
     defaultValues: { ... }
   });
   ```

2. Form Structure:

   - Wrap in `<form onSubmit={handleSubmit(onSubmit)}>`
   - Use `FormField` component for field wrappers
   - Use shared input components (TextInput, Select, etc.)
   - Place buttons in flex container with gap

3. Form Validation:

   - Add validation rules via register options
   - Use `required`, `min`, `valueAsNumber` etc.
   - Handle server errors with toast notifications

4. Form State:

   - Use `isSubmitting` for loading states
   - Disable submit button while submitting
   - Reset form after successful submission
   - Close modals after success

5. Form Feedback:
   - Show success toasts after submission
   - Show error toasts with descriptions
   - Clear validation feedback
   - Proper button states (loading, disabled)

### Function & Code Organization

1. Keep functions under 200 lines of code
2. Extract complex hooks and functions into separate files
3. Break down complex logic into smaller, focused functions

## Project Structure

- Uses Wasp for full-stack development
- Uses TypeScript for type safety
- Uses React for frontend components

## Authentication Flow

- Email verification and organization invitation are handled in `onAfterSignup` hook
- Organization membership is created during invitation acceptance

## Onboarding Flow

- Progress is tracked in `OnboardingState` model
- Steps: welcome → organization → spaces → invite → complete
- Each step updates corresponding onboarding state flags
- Users can't skip ahead to steps they haven't reached

# Codebase Structure

## Navigation

- The app uses a sidebar layout with navigation managed by the `useAppNavigation` hook
- Navigation items are defined in `src/client/hooks/use-app-navigation.ts`
- Each navigation item has: name, route, icon, and optional count
- Routes are defined in `main.wasp`

## Layouts

- Main layout component is `SidebarLayout` in `src/client/components/layouts/sidebar-layout.tsx`
- SidebarLayout props:
  - children: ReactNode
  - header?: { title: string, description?: string, actions?: ReactNode }

## Pages

- Team page: `/team` - Manages team members and roles
- Spaces: `/venues` - Manages venues and spaces
- Account: `/account` - User account settings
- Schedule: `/schedule/:venueId` - Calendar and scheduling
- Venue: `/venues/:venueId` - Venue specific management

## Calendar System

The calendar system is built around several key components:

### Components

- `WeekViewCalendar.tsx`: Main calendar component that orchestrates the display of reservations and spaces
- `ReservationsSection.tsx`: Handles the display and interaction with reservations
- `ReservationSlot.tsx`: Individual reservation display component
- `GridSelection.tsx`: Handles the grid-based selection UI for creating new reservations
- `CalendarFooter.tsx`: Displays pending changes and provides action buttons
  - Shows descriptive messages for different change types
  - Provides apply and cancel actions
  - Only visible when there are pending changes
  - Uses consistent design language with the rest of the app

### State Management

The calendar uses multiple providers for different aspects of state:

- `PendingChangesProvider`: Manages a single pending change to reservations
  - Tracks one CREATE, UPDATE, or DELETE operation at a time
  - Maintains old and new state for the change
  - Provides simple operations (apply, cancel)
  - Handles error states with clear feedback
  - Displays changes in the footer with clear descriptions
- `DraftReservationProvider`: Manages draft reservation state for new/edited reservations
- `SelectionProvider`: Manages the grid selection state for creating new reservations
  - Handles mouse interactions (down, move, up)
  - Manages selection bounds and validation
  - Provides time availability checking
  - Handles selection completion callbacks
- `DateProvider`: Manages selected date state
- `ScheduleQueryProvider`: Manages venue and schedule data

### UI/UX Patterns

- Consistent action patterns:
  - Primary actions use pink-600 background
  - Secondary actions use white background with border
  - All buttons have proper hover and focus states
  - Clear visual hierarchy for actions
- Status indicators:
  - Yellow dot for pending changes
  - Clear, human-readable descriptions
  - Time ranges shown in 12-hour format
- Responsive layout:
  - Footer fixed to bottom of viewport
  - Maximum width to match content
  - Proper spacing and alignment
  - Clear visual separation with border

Each provider follows a consistent pattern:

- Context creation with TypeScript interfaces
- Provider component with state management
- Custom hook for consuming components (e.g. `useReservationSelection`, `useDraftReservation`, `usePendingChanges`)
- Clear error messages for usage outside provider
- Proper TypeScript typing for all interfaces and functions

### Provider Hierarchy

The providers are nested in the following order:

1. `PendingChangesProvider` (outermost)
2. `DraftReservationProvider`
3. `SelectionProvider` (innermost)

This hierarchy ensures that:

- Changes can be tracked and managed one at a time
- Draft reservations can be converted to pending changes
- Selection can create draft reservations

### Key Features

- Drag and drop functionality for reservations
- Draft reservations for new bookings
- Grid-based selection system for creating reservations
  - Mouse-based selection with visual feedback
  - Time slot availability validation
  - Selection bounds calculation
  - Owner-specific availability rules
- Collision detection for reservations
- Grid-based layout for time slots and spaces
- Single change management
  - One change can be staged at a time
  - Changes can be cancelled
  - Changes are applied with proper error handling
  - Clear user feedback on success/failure
