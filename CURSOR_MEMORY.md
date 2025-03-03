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

### PriceCondition

The payment rules system has been extended to support conditional pricing through the `PriceCondition` entity. This allows for creating rules that only apply under specific conditions:

1. Time-based conditions: Rules can be restricted to apply only during specific time ranges
   - Defined by `startTime` and `endTime` fields
   - Time is compared against the booking's start time
   - Format is 24-hour time in HH:MM format (e.g., "09:00", "17:30")

2. User tag-based conditions: Rules can be restricted to users with specific tags
   - Defined by `userTags` field which is an array of strings
   - A user must have at least one matching tag for the condition to apply
   - Empty tags array means the condition applies to all users

3. Multiple conditions support: Payment rules can have multiple conditions
   - A rule applies if ANY of its conditions match (logical OR)
   - If no conditions are specified, the rule applies to all bookings

### Implementation Details

- The system uses an extended `PaymentRule` type that includes an optional `conditions` field
- Conditions are checked in the `isRuleApplicable` function before applying any payment rule
- The `isPriceConditionApplicable` helper function evaluates if a specific condition applies based on:
  - Current booking time
  - User tags
  - Time matching logic checks if booking start time falls within condition's time range
  - Tag matching logic checks for at least one common tag between user and condition

- Time comparison is done using the 24-hour format for consistency:
  - Times are parsed into hours and minutes
  - Comparison uses numerical values (e.g., "09:30" becomes 9.5 hours)
  - This handles edge cases like midnight and ensures proper ordering

### Test Coverage

The system includes comprehensive tests for the price condition functionality:
- Tests for user tag matching
- Tests for time range matching
- Tests for multiple conditions (ANY match logic)
- Tests for combined time and tag conditions

#### Student Discount Calculation Tests

Detailed tests demonstrate how to use conditions for common pricing scenarios:

1. **Basic Student Discount**: A 25% discount applied only to users with a "student" tag.
   - Regular users pay the full price
   - Students receive the discounted rate automatically

2. **Multiple-Hour Bookings**: Tests verify that discount calculations work correctly for longer bookings.
   - 3-hour booking calculations show the discount applies to the total base cost
   - Proper percentage discounts regardless of booking duration

3. **Time-Restricted Student Discounts**: Tests show off-peak pricing with conditions.
   - 40% discount for students during off-peak hours (9 AM - 3 PM)
   - No discount outside the specified time range, even for students

4. **Combined Discount Scenarios**: Tests verify the interaction of multiple discount rules.
   - Student discount (30%) and senior discount (20%) applying sequentially
   - User with both tags gets both discounts (not compounded)
   - Rules are applied in priority order for predictable behavior

5. **Complex Pricing Scenarios**: Comprehensive tests verify real-world pricing models.
   - Base rates with peak-hour multipliers (1.5x during 8 AM - 5 PM)
   - Conditional student discounts (25% off)
   - Equipment fees (flat fee of $10)
   - Testing all combinations:
     - Regular users during peak hours
     - Students during peak hours
     - Regular users during off-peak hours
     - Students during off-peak hours

These tests demonstrate how the conditional pricing system enables sophisticated pricing strategies, including:
- Time-of-day pricing variations
- User category discounts
- Multiple stacked discounts
- Peak vs. off-peak pricing
- Equipment or service fees

The testing suite validates the rule application order is preserved, ensuring predictable pricing outcomes in all scenarios.

This conditional pricing system allows for more flexible and targeted payment rules, enabling scenarios like:
- Peak/off-peak pricing
- Special rates for members vs. non-members
- Time-of-day pricing variations
- Special event pricing

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

# Block Spot App Development Notes

## Payment System

### 2023-08-17: Added Price Breakdown to Payment Rules

Added a detailed price breakdown structure to the `runPaymentRules` function to provide user-facing information about how costs are calculated. This allows frontend components to display a detailed breakdown of charges.

Key changes:
- Added `PriceBreakdown` and `PriceBreakdownItem` types to `src/schedule/operations/payment-rules.ts`
- Updated return type of `runPaymentRules` to include the breakdown
- Modified the implementation to track each pricing component separately
- Updated calling functions to handle the new return values

The `priceBreakdown` object includes:
- Base rate information
- Fees (flat fees, etc.)
- Discounts applied
- Multipliers used
- Subtotal and final total

### 2023-08-17 Update: Made Price Breakdown Optional

Updated the `runPaymentRules` function to make the price breakdown optional:
- Changed return type to have `priceBreakdown?` as an optional property
- Only returns price breakdown when there are applicable rules that affected the price
- Removed default empty breakdown objects
- This makes the API more efficient by not returning empty structures when they're not needed

#### PaymentRule Entity Structure
The `PaymentRule` entity in the system:
- Has a `ruleType` that can be: BASE_RATE, MULTIPLIER, DISCOUNT, FLAT_FEE
- Includes pricing information like `pricePerPeriod`, `periodMinutes`, `multiplier`, etc.
- Can be targeted to specific spaces via `spaceIds`
- Includes time constraints like `startTime`, `endTime`, and `daysOfWeek`
- Is prioritized via a `priority` field (lower = applied first)

The payment calculation handles different rule types in sequence, with BASE_RATE establishing the initial price, then applying multipliers, discounts, and fees in order of priority.
