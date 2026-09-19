import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { Badge } from './ui';

export function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.images?.[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight">{product.name}</h3>
          {product.compareAtPrice && <Badge tone="brand">Sale</Badge>}
        </div>
        <p className="text-sm text-slate-500 line-clamp-2">{product.category?.name}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{formatCurrency(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-slate-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
