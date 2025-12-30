import React from 'react';

export interface ProductCardProps {
  /** Product image URL */
  imageUrl: string;
  /** Product image alt text */
  imageAlt: string;
  /** Product category */
  category: string;
  /** Product title */
  title: string;
  /** Product description */
  description: string;
  /** Product price */
  price: string;
  /** Add to cart handler */
  onAddToCart?: () => void;
  /** Card click handler */
  onClick?: () => void;
  /** Show hover effect */
  hoverable?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  imageUrl,
  imageAlt,
  category,
  title,
  description,
  price,
  onAddToCart,
  onClick,
  hoverable = true,
}) => {
  return (
    <article
      className={`
        flex flex-col w-80 bg-white rounded-2xl shadow-lg overflow-hidden
        ${hoverable ? 'transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl' : ''}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Image */}
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 pb-4">
        {/* Category */}
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {category}
        </span>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2">
          {description}
        </p>

        {/* Price Row */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-bold text-[#3366e6]">
            {price}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="
              px-4 py-2 bg-[#3366e6] text-white text-sm font-semibold
              rounded-lg transition-colors duration-200
              hover:bg-[#2952b8] focus:outline-none focus:ring-2
              focus:ring-[#3366e6] focus:ring-offset-2
            "
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
};

ProductCard.defaultProps = {
  hoverable: true,
};
