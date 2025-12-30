# Button Component Example

This example demonstrates how the Figma-to-Code Agent converts a button design into a React component.

## Figma Design

The source Figma design (`figma-data.json`) represents a primary button with:

- **Layout**: Horizontal auto-layout with center alignment
- **Sizing**: 160x48 pixels with 24px horizontal / 12px vertical padding
- **Styling**: Blue background (#3366E6), 8px border radius, drop shadow
- **Typography**: Inter font, 16px, semibold, white text

## Generated Output

### Button.tsx

A fully functional React component with:

- TypeScript interfaces for props
- Multiple variants (primary, secondary, outline)
- Multiple sizes (sm, md, lg)
- Disabled state handling
- Tailwind CSS styling
- Accessibility attributes

### Button.test.tsx

Comprehensive test coverage including:

- Render tests
- Click interaction tests
- Disabled state tests
- Variant and size tests
- Accessibility tests
- Keyboard navigation tests
- Snapshot tests

## Usage

```tsx
import { Button } from './Button';

// Primary button (default)
<Button onClick={() => console.log('clicked')}>
  Click me
</Button>

// Secondary variant
<Button variant="secondary">Secondary</Button>

// Outline variant
<Button variant="outline">Outline</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Button content |
| `onClick` | `() => void` | - | Click handler |
| `variant` | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disabled state |
