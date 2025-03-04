# BlockSpot Codebase Memory

## Project Structure
- BlockSpot is a booking platform for small businesses built with Wasp framework
- Uses React for frontend components
- TypeScript for type safety

## Components
- Uses a card-based UI system with reusable components
- Common components are in `src/client/components/`
- Page components are organized by feature area

## Pages
- `MyBookingsPage`: Shows user's upcoming and past bookings with tabs to switch between them
  - Located at: `src/user/my-bookings/my-bookings-page.tsx`
  - Includes components:
    - `BookingStatusBadge`: Displays booking status with appropriate styling
    - `BookingsList`: Renders a list of bookings with details
    - `NewBookingCard`: Card for creating new bookings
    - `BookingTabs`: Tab navigation between upcoming and past bookings
  - Uses `getUserBookings` query to fetch bookings filtered by type (upcoming/past)
  
- `AccountPage`: Shows user account information and organizations
  - Located at: `src/user/account/account-page.tsx`

## Data Structure
- Uses organizations and venues model
- Bookings are tied to specific venues and spaces
- Users can belong to organizations with specific roles

## Operations
- `getUserBookings`: Query to fetch user's bookings
  - Located at: `src/user/my-bookings/operations.ts`
  - Takes a `type` parameter to filter bookings as "upcoming" or "past"
  - Returns bookings with related space and venue information
  - Upcoming bookings: endTime is in the future and status is not CANCELLED
  - Past bookings: endTime is in the past and status is not CANCELLED
  - All cancelled reservations are filtered out at the API level

## UI Patterns
- Uses Tailwind CSS for styling
- Card components for content sections
- Yellow as primary accent color
- Responsive design with mobile-friendly layouts 