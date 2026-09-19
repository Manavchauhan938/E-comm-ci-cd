import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { Button, Badge, Skeleton } from '../components/ui';
import { ProductCard } from '../components/ProductCard';
import { formatCurrency } from '../lib/utils';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${slug}`)
      .then((r) => {
        setProduct(r.data.data);
        setActiveImage(0);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!product) {
    return <p className="p-10 text-center text-slate-500">Product not found</p>;
  }

  const inStock = product.stockQuantity > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Helmet>
        <title>{product.name} — E-Comm</title>
        <meta name="description" content={product.description.slice(0, 160)} />
      </Helmet>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={product.images?.[activeImage]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {(product.images || []).map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                  i === activeImage ? 'border-brand-600' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-brand-600">{product.category?.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
            <Badge tone={inStock ? 'success' : 'danger'}>{inStock ? 'In stock' : 'Out of stock'}</Badge>
          </div>
          {product.avgRating != null && (
            <p className="mt-2 text-sm text-slate-500">
              {product.avgRating} ★ · {product.reviewCount} reviews
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-xl border">
              <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                -
              </button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button
                type="button"
                className="px-3 py-2"
                onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
              >
                +
              </button>
            </div>
            <Button disabled={!inStock} onClick={() => addItem(product.id, qty)}>
              Add to cart
            </Button>
            <Link to="/checkout">
              <Button variant="secondary" disabled={!inStock} onClick={() => addItem(product.id, qty)}>
                Buy now
              </Button>
            </Link>
          </div>

          <div className="mt-8 border-b border-slate-200">
            {['description', 'reviews'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`mr-4 border-b-2 pb-2 text-sm capitalize ${
                  tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tab === 'description' && <p>{product.description}</p>}
            {tab === 'reviews' &&
              (product.reviews?.length ? (
                <ul className="space-y-4">
                  {product.reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border p-3">
                      <p className="font-medium">
                        {r.user?.name} · {r.rating}★
                      </p>
                      <p className="mt-1">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No reviews yet.</p>
              ))}
          </div>
        </div>
      </div>

      {product.related?.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-semibold">Related products</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
