# Product Card Example

This example demonstrates how the Figma-to-Code Agent converts a product card design into a React component.

## Figma Design

The source Figma design (`figma-data.json`) represents a product card with:

- **Layout**: Vertical auto-layout
- **Sections**: Image, category, title, description, price row
- **Styling**: White background, 16px border radius, drop shadow
- **Interactive**: Add to cart button

## Generated Output

### ProductCard.tsx

A complete e-commerce product card with:

- TypeScript interface for all product data
- Image with lazy loading
- Category, title, and description display
- Price formatting
- Add to cart button with event handling
- Optional click handler for card navigation
- Hover effects
- Keyboard accessibility

### ProductCard.test.tsx

Comprehensive tests including:

- Content rendering
- User interactions
- Event propagation (add to cart doesn't trigger card click)
- Keyboard navigation
- Hover behavior
- Accessibility

## Usage

```tsx
import { ProductCard } from './ProductCard';

<ProductCard
  imageUrl="/products/headphones.jpg"
  imageAlt="Wireless Headphones"
  category="Electronics"
  title="Wireless Headphones"
  description="Premium noise-canceling headphones with 30-hour battery life."
  price="$299.99"
  onAddToCart={() => addToCart(product)}
  onClick={() => navigate(`/products/${product.id}`)}
  hoverable
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `imageUrl` | `string` | Yes | - | Product image URL |
| `imageAlt` | `string` | Yes | - | Image alt text |
| `category` | `string` | Yes | - | Product category |
| `title` | `string` | Yes | - | Product title |
| `description` | `string` | Yes | - | Product description |
| `price` | `string` | Yes | - | Formatted price |
| `onAddToCart` | `() => void` | No | - | Add to cart handler |
| `onClick` | `() => void` | No | - | Card click handler |
| `hoverable` | `boolean` | No | `true` | Enable hover effects |

## Features

- **Responsive**: Adapts to container width
- **Accessible**: Keyboard navigable, proper roles
- **Performant**: Lazy-loaded images
- **Interactive**: Click and hover states
