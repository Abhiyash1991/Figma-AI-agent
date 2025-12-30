# Examples

This directory contains example Figma designs and their corresponding generated React components.

## Available Examples

### 1. [Button](./button/)
A simple button component demonstrating:
- Basic Figma node structure
- Tailwind CSS styling
- Variants and sizes
- Interactive states
- Comprehensive tests

### 2. [Product Card](./card/)
An e-commerce product card demonstrating:
- Nested component structure
- Image handling
- Complex layout with flexbox
- Click interactions
- Keyboard accessibility

### 3. [Login Form](./form/)
A complete login form demonstrating:
- Form state management
- Input validation
- Error handling
- Loading states
- Reusable input components

## Example Structure

Each example contains:

```
example-name/
├── figma-data.json    # Mock Figma node data
├── ComponentName.tsx  # Generated React component
├── ComponentName.test.tsx  # Generated tests
└── README.md          # Documentation
```

## Using Examples

### View Generated Code

Each example shows what the Figma-to-Code Agent produces from a given Figma design.

### Test the Components

```bash
# From project root
npm test -- --testPathPattern="examples"
```

### Use as Reference

When the agent generates code from your Figma designs, it will follow similar patterns to these examples.

## Adding New Examples

1. Create a new directory under `examples/`
2. Add the Figma JSON data
3. Add the generated component
4. Add tests
5. Add a README documenting the example

## What to Expect

The generated code will:

- Use TypeScript with proper interfaces
- Follow React best practices
- Include Tailwind CSS classes
- Be accessible (ARIA attributes, keyboard support)
- Have comprehensive test coverage

## Customization

The examples use default settings:
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Tests**: Jest + React Testing Library

You can customize these with CLI options or configuration file.
