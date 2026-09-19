import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders label', () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });
});

describe('ProductCard', () => {
  it('links to product slug', () => {
    render(
      <MemoryRouter>
        <ProductCard
          product={{
            id: '1',
            name: 'Aurora Headphones',
            slug: 'aurora-wireless-headphones',
            price: 199.99,
            images: ['https://example.com/a.jpg'],
            category: { name: 'Electronics' },
          }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Aurora Headphones')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/products/aurora-wireless-headphones'
    );
  });
});
