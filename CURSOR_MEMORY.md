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

## Pricing & Payment Structure

### Plans

- Two tier pricing structure:
  1. Community Plan ($5/month)
     - Perfect for small businesses and community centers
     - Unlimited bookings per month
     - One location
     - One admin user
     - Calendar sync
     - Basic support
  2. Business Plan ($25/month) - Most Popular
     - Everything in Community plan
     - Unlimited bookings
     - Multiple venues & spaces
     - Priority support
     - Advanced availability rules
     - Analytics & reporting

### Payment Integration

- Uses Stripe for payment processing
- Plan IDs stored in environment variables:
  - PAYMENTS_COMMUNITY_SUBSCRIPTION_PLAN_ID
  - PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID
- Subscription statuses: past_due, cancel_at_period_end, active, deleted
- Customer portal available for subscription management
- 30-day free trial for all plans

### Code Structure

- Plans defined in `src/payment/plans.ts`
- UI components in `src/payment/PricingPage.tsx`
- Uses PaymentPlanId enum for type safety
- Stripe checkout session generation handled by backend
- Organization model tracks subscription status and plan type

### UI/UX Patterns

- Teal color scheme for pricing elements
- Most popular plan highlighted with teal ring
- Consistent feature list with checkmark icons
- Clear price display with /month indicator
- Responsive grid layout for plan cards

## Database Management

### Rules & Best Practices

1. Database Schema Changes

   - ALWAYS use Prisma for database schema changes
   - NEVER use direct SQL migrations
   - Update schema.prisma file for any model changes
   - Let Prisma handle the migration generation

2. Schema Updates Process
   - Modify schema.prisma file
   - DB updates will happen automatically when you run `wasp db migrate-dev`

# Codebase Memory

## Stripe Integration

- The application uses Stripe Connect for payment processing
- Stripe account creation and linking is handled in `src/payment/stripe/operations.ts`
- Two pages handle Stripe Connect flow:
  1. `src/payment/stripe/pages/stripe-return.tsx`: Handles successful account setup
     - Route: `/stripe-return/:accountId`
     - Requires authentication
     - Verifies account ID matches organization
  2. `src/payment/stripe/pages/stripe-refresh.tsx`: Handles account setup refresh
     - Route: `/stripe-refresh/:accountId`
     - Requires authentication
     - Creates new account link and redirects to Stripe

### Organization Structure

- Organizations can have Stripe accounts associated with them
- Organization data is accessed through `useOrganization` hook in `src/organization/hooks/use-organization.ts`
- Organization data includes:
  - `stripeCustomerId`
  - `subscriptionStatus`
  - `subscriptionPlanId`
  - `datePaid`
  - `credits`

### UI Components

- Uses Tailwind CSS for styling
- Common components:
  - `PageLayout`: Main layout component with header support
  - `Card`: Container component for content
  - Uses teal-600 as primary color for buttons and accents

## Payment Rules Implementation

### Current Structure

- Organization model tracks Stripe integration via:
  - `stripeCustomerId`
  - `stripeAccountId`
  - `subscriptionStatus`
  - `subscriptionPlanId`
- Venues and Spaces have no direct payment fields yet
- Reservations track status but no payment information

### Recommended Payment Rules Schema Updates

Add the following models to schema.prisma:

```prisma
model PaymentRule {
  id          String    @id @default(uuid())
  venueId     String
  venue       Venue     @relation(fields: [venueId], references: [id])
  spaceIds    String[]  @default([]) // Optional: specific spaces this rule applies to

  // Pricing
  minimumHours Int      @default(1)
  currency     String   @default("USD")

  // Booking Rules
  requireUpfrontPayment Boolean @default(true)
  cancellationPolicy    CancellationPolicy @default(FLEXIBLE)
  depositAmount         Decimal? // Optional security deposit

  // Time-based variations
  weekendPriceMultiplier Decimal? // e.g. 1.5x for weekends
  peakHourStart         Int? // minutes from midnight
  peakHourEnd           Int? // minutes from midnight
  peakHourMultiplier    Decimal? // e.g. 1.25x for peak hours

  // Discounts
  hourlyDiscountThreshold Int? // hours after which discount applies
  hourlyDiscountRate     Decimal? // e.g. 0.1 for 10% off

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum CancellationPolicy {
  FLEXIBLE    // Full refund 24h prior
  MODERATE    // Full refund 5 days prior
  STRICT      // 50% refund until 7 days prior
}

// Add to Reservation model:
model Reservation {
  // ... existing fields ...
  paymentStatus PaymentStatus
  paymentAmount Decimal
  paymentId     String?    // Stripe payment intent ID
  refundStatus  RefundStatus?
  refundAmount  Decimal?
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum RefundStatus {
  PENDING
  COMPLETED
  FAILED
}
```

### Implementation Recommendations

1. Payment Rule Management

   - Create PaymentRulesPage component under venue settings
   - Allow setting default rules at venue level
   - Support space-specific rule overrides
   - Implement rule conflict resolution logic

2. Pricing Calculation Service

   ```typescript
   interface PricingDetails {
     basePrice: number;
     peakMultiplier: number;
     weekendMultiplier: number;
     discounts: Array<{ type: string; amount: number }>;
     finalPrice: number;
   }

   function calculateReservationPrice(
     startTime: Date,
     endTime: Date,
     spaceId: string,
     venueId: string,
   ): PricingDetails;
   ```

3. Reservation Flow Updates

   - Add payment step to reservation creation
   - Implement hold/temporary reservation during checkout
   - Add payment status tracking
   - Implement cancellation and refund workflows

4. UI Components Needed

   - PaymentRuleForm for rule creation/editing
   - PricingDisplay for showing breakdown
   - PaymentSummary for checkout
   - RefundRequestForm for cancellations

5. Stripe Integration Extensions
   - Add webhook handlers for payment events
   - Implement refund processing
   - Add payment reporting dashboard
   - Handle failed payment scenarios

### Security Considerations

1. Payment Data

   - Never store raw payment details
   - Use Stripe Elements for payment forms
   - Implement proper error handling
   - Log payment-related events

2. Access Control
   - Only venue owners can modify payment rules
   - Validate all pricing calculations server-side
   - Implement rate limiting on payment endpoints
   - Add audit logging for payment changes

### Testing Strategy

1. Unit Tests

   - Price calculation logic
   - Rule validation
   - Conflict resolution

2. Integration Tests

   - Payment processing flow
   - Refund processing
   - Webhook handling

3. E2E Tests
   - Complete reservation with payment
   - Cancellation and refund flow
   - Payment rule updates

## Payment System Design

### Core Models

1. **Reservation**

   - Purely handles booking details (time, space, user)
   - Links to payment via one-to-one relation
   - Keeps payment concerns separate from booking logic

2. **Payment**

   - Minimal design focused on Stripe integration
   - Tracks `stripeCheckoutSessionId`
   - One-to-one relationship with Reservation
   - Separation of concerns: handles only payment processing state

3. **PaymentRule**
   - Flexible rule system for price calculations
   - Rules can be stacked and combined
   - Supports venue-wide and space-specific rules

### Payment Rules System

#### Rule Types (`RuleType` enum)

- `BASE_RATE`: Establishes the foundational price per hour
- `MULTIPLIER`: Percentage-based modifications (e.g., peak hours = 1.5x)
- `DISCOUNT`: Rate reductions (e.g., bulk booking discounts)
- `FLAT_FEE`: Fixed charges (e.g., cleaning fee, setup fee)

#### Rule Application

1. **Priority-Based Stacking**

   - Rules are applied in priority order (lower numbers first)
   - Allows for predictable calculation of final price
   - Multiple rules can affect the same booking

2. **Time-Based Conditions**

   - `startTime`/`endTime`: Minutes from midnight for precise timing
   - `daysOfWeek`: Integer array (0-6) for day-specific rules
   - Supports:
     - Peak hour pricing
     - Weekend rates
     - Holiday pricing
     - Seasonal variations

3. **Booking Conditions**
   - `minHoursRequired`: Minimum duration for rule application
   - `maxHoursAllowed`: Maximum duration for rule application
   - `requiredTags`: Conditional application based on tags

#### Space Targeting

- Rules can target:
  1. All spaces in a venue (empty `spaceIds`)
  2. Specific spaces (`spaceIds` array)
- Enables:
  - Venue-wide pricing policies
  - Space-specific rates
  - Equipment or feature-based pricing

### Price Calculation Flow

1. **Rule Collection**

   ```typescript
   // Pseudocode for rule application
   const rules = await collectApplicableRules({
     venueId,
     spaceId,
     startTime,
     endTime,
     tags,
   });

   // Sort by priority
   rules.sort((a, b) => a.priority - b.priority);
   ```

2. **Rule Application**

   ```typescript
   let finalPrice = 0;

   // Apply BASE_RATE first
   const baseRate = rules.find((r) => r.ruleType === "BASE_RATE");
   if (baseRate) {
     finalPrice = calculateBasePrice(baseRate, hours);
   }

   // Apply modifiers in priority order
   for (const rule of rules) {
     switch (rule.ruleType) {
       case "MULTIPLIER":
         finalPrice *= rule.multiplier;
         break;
       case "DISCOUNT":
         finalPrice *= 1 - rule.discountRate;
         break;
       case "FLAT_FEE":
         finalPrice += rule.amount;
         break;
     }
   }
   ```

### Example Scenarios

1. **Peak Hour Pricing**

   ```prisma
   {
     ruleType: MULTIPLIER
     priority: 1
     multiplier: 1.5
     startTime: 540  // 9:00 AM
     endTime: 1020   // 5:00 PM
     daysOfWeek: [1,2,3,4,5]  // Weekdays only
   }
   ```

2. **Weekend Rates**

   ```prisma
   {
     ruleType: MULTIPLIER
     priority: 1
     multiplier: 2.0
     daysOfWeek: [0,6]  // Saturday and Sunday
   }
   ```

3. **Bulk Booking Discount**

   ```prisma
   {
     ruleType: DISCOUNT
     priority: 2
     discountRate: 0.15  // 15% off
     minHoursRequired: 4  // For bookings 4+ hours
   }
   ```

4. **Cleaning Fee**
   ```prisma
   {
     ruleType: FLAT_FEE
     priority: 3
     amount: 50
   }
   ```

### Best Practices

1. **Rule Priority**

   - Keep BASE_RATE rules at highest priority (lowest number)
   - Apply multipliers before discounts
   - Add flat fees last
   - Use consistent priority ranges for rule types

2. **Time Conditions**

   - Use minutes from midnight for precise timing
   - Consider timezone implications
   - Account for overnight bookings

3. **Rule Management**

   - Validate rule conflicts
   - Ensure at least one BASE_RATE rule exists
   - Document rule combinations
   - Test edge cases

4. **Performance**
   - Index frequently queried fields
   - Cache common rule combinations
   - Optimize rule collection queries

# Project Memory

## Components

### HorizontalScrollProvider

- Located in: `src/schedule/calendar/providers/horizontal-scroll-provider.tsx`
- Purpose: Provides context for tracking horizontal scroll position in the calendar view
- Features:
  - Tracks scrolledPixels through context
  - Automatically attaches to `.overflow-x-auto` container
  - Provides `useHorizontalScroll` hook for consuming components
- Usage: Wraps calendar components that need access to horizontal scroll position
