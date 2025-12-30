import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

const defaultProps = {
  imageUrl: 'https://example.com/image.jpg',
  imageAlt: 'Test Product',
  category: 'Electronics',
  title: 'Wireless Headphones',
  description: 'Premium noise-canceling headphones with 30-hour battery life.',
  price: '$299.99',
};

describe('ProductCard', () => {
  it('renders without crashing', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('displays product image', () => {
    render(<ProductCard {...defaultProps} />);
    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('displays category', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('displays title', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
  });

  it('displays description', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText(/Premium noise-canceling headphones/)).toBeInTheDocument();
  });

  it('displays price', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('$299.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when add to cart button is clicked', async () => {
    const handleAddToCart = jest.fn();
    render(<ProductCard {...defaultProps} onAddToCart={handleAddToCart} />);

    await userEvent.click(screen.getByText('Add to Cart'));
    expect(handleAddToCart).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when card is clicked', async () => {
    const handleClick = jest.fn();
    render(<ProductCard {...defaultProps} onClick={handleClick} />);

    await userEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClick when add to cart is clicked', async () => {
    const handleClick = jest.fn();
    const handleAddToCart = jest.fn();
    render(
      <ProductCard
        {...defaultProps}
        onClick={handleClick}
        onAddToCart={handleAddToCart}
      />
    );

    await userEvent.click(screen.getByText('Add to Cart'));
    expect(handleAddToCart).toHaveBeenCalled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has proper button role when onClick is provided', () => {
    render(<ProductCard {...defaultProps} onClick={jest.fn()} />);
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
  });

  it('supports keyboard navigation when clickable', async () => {
    const handleClick = jest.fn();
    render(<ProductCard {...defaultProps} onClick={handleClick} />);

    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });

  it('applies hover effect when hoverable is true', () => {
    render(<ProductCard {...defaultProps} hoverable={true} />);
    const card = screen.getByRole('article');
    expect(card).toHaveClass('hover:-translate-y-1');
  });

  it('does not apply hover effect when hoverable is false', () => {
    render(<ProductCard {...defaultProps} hoverable={false} />);
    const card = screen.getByRole('article');
    expect(card).not.toHaveClass('hover:-translate-y-1');
  });

  it('image has lazy loading', () => {
    render(<ProductCard {...defaultProps} />);
    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('matches snapshot', () => {
    const { container } = render(<ProductCard {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
