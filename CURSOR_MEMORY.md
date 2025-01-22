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
