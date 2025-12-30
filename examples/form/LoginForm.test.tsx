import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnSignUpClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  it('displays form title and subtitle', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('allows entering email and password', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls onSubmit with form data when valid', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows validation error for empty email', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for empty password', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for short password', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays error message when error prop is provided', () => {
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        error="Invalid credentials"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('shows loading state when isLoading is true', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });

  it('calls onSignUpClick when sign up link is clicked', async () => {
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onSignUpClick={mockOnSignUpClick}
      />
    );

    await userEvent.click(screen.getByText('Sign up'));
    expect(mockOnSignUpClick).toHaveBeenCalledTimes(1);
  });

  it('has accessible form elements', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('input has aria-invalid when error is present', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('supports keyboard navigation', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Tab through form elements
    await userEvent.tab();
    expect(screen.getByLabelText(/email/i)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(/password/i)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
  });

  it('submits form on Enter key', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123{enter}');

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { container } = render(<LoginForm onSubmit={mockOnSubmit} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
