# Login Form Example

This example demonstrates how the Figma-to-Code Agent converts a login form design into React components with full form validation.

## Figma Design

The source Figma design (`figma-data.json`) represents a login form with:

- **Header**: Title and subtitle
- **Inputs**: Email and password fields with labels
- **Button**: Submit button
- **Footer**: Sign up link

## Generated Output

### LoginForm.tsx

A complete login form with:

- TypeScript interfaces
- Form state management with useState
- Client-side validation
- Loading state with spinner
- Error display (field-level and global)
- Accessible form elements
- Reusable InputField component

### LoginForm.test.tsx

Comprehensive tests including:

- Rendering tests
- Input interaction tests
- Validation tests (email format, password length)
- Form submission tests
- Loading state tests
- Error display tests
- Accessibility tests
- Keyboard navigation tests

## Usage

```tsx
import { LoginForm } from './LoginForm';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError(undefined);

    try {
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      onSignUpClick={() => navigate('/signup')}
    />
  );
}
```

## Props

### LoginFormProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onSubmit` | `(data: { email: string; password: string }) => void` | Yes | - | Form submission handler |
| `isLoading` | `boolean` | No | `false` | Loading state |
| `error` | `string` | No | - | Global error message |
| `onSignUpClick` | `() => void` | No | - | Sign up link handler |

### InputFieldProps (Reusable)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | - | Input label |
| `type` | `'text' \| 'email' \| 'password'` | Yes | - | Input type |
| `value` | `string` | Yes | - | Input value |
| `onChange` | `(value: string) => void` | Yes | - | Value change handler |
| `placeholder` | `string` | No | - | Placeholder text |
| `error` | `string` | No | - | Error message |
| `name` | `string` | Yes | - | Input name |
| `required` | `boolean` | No | `false` | Required field |

## Features

- **Validation**: Email format, password length
- **Accessibility**: Labels, ARIA attributes, keyboard navigation
- **Loading State**: Disabled button with spinner
- **Error Handling**: Field-level and global errors
- **Responsive**: Full-width on mobile
