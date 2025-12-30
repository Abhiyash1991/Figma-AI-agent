import React, { useState } from 'react';

export interface LoginFormProps {
  /** Form submission handler */
  onSubmit: (data: { email: string; password: string }) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Sign up link click handler */
  onSignUpClick?: () => void;
}

export interface InputFieldProps {
  /** Input label */
  label: string;
  /** Input type */
  type: 'text' | 'email' | 'password';
  /** Input value */
  value: string;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Input name for form */
  name: string;
  /** Required field */
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  name,
  required = false,
}) => {
  const inputId = `input-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`
          w-full px-4 py-3 text-base border rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-[#3366e6] focus:border-transparent
          ${error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <span
          id={`${inputId}-error`}
          className="text-sm text-red-500"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
};

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  onSignUpClick,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({ email, password });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-8 bg-white rounded-2xl shadow-lg"
        noValidate
      >
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="text-base text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Global Error */}
        {error && (
          <div
            className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Email Input */}
        <InputField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          error={fieldErrors.email}
          required
        />

        {/* Password Input */}
        <InputField
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          error={fieldErrors.password}
          required
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3.5 text-base font-semibold text-white
            bg-[#3366e6] rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#3366e6] focus:ring-offset-2
            ${isLoading
              ? 'opacity-70 cursor-not-allowed'
              : 'hover:bg-[#2952b8]'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSignUpClick}
            className="font-medium text-[#3366e6] hover:underline focus:outline-none focus:underline"
          >
            Sign up
          </button>
        </p>
      </form>
    </div>
  );
};

// Also export InputField for reuse
export { InputField };
