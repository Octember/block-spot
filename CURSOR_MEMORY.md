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
