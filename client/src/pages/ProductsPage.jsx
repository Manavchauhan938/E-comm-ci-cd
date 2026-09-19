import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { Dropdown, Input, Skeleton, Button } from '../components/ui';

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');

  const page = Number(params.get('page') || 1);
  const sort = params.get('sort') || 'newest';
  const category = params.get('category') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const searchParam = params.get('search') || '';

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products', {
        params: {
          page,
          limit: 12,
          sort,
          category: category || undefined,
          search: searchParam || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
        },
      })
      .then((r) => {
        setData(r.data.data || []);
        setMeta(r.data.meta || { page: 1, totalPages: 1 });
      })
      .finally(() => setLoading(false));
  }, [page, sort, category, minPrice, maxPrice, searchParam]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in patch)) next.set('page', '1');
    setParams(next);
  };

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-10 sm:px-6">
      <Helmet>
        <title>Products — E-Comm</title>
      </Helmet>
      <aside className="hidden w-56 shrink-0 space-y-6 lg:block">
        <div>
          <p className="mb-2 text-sm font-semibold">Category</p>
          <div className="space-y-1">
            <button
              type="button"
              className={`block text-sm ${!category ? 'text-brand-600' : 'text-slate-600'}`}
              onClick={() => update({ category: '' })}
            >
              All
            </button>
            {categories
              .filter((c) => !c.parentId)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`block text-sm ${category === c.slug ? 'text-brand-600' : 'text-slate-600'}`}
                  onClick={() => update({ category: c.slug })}
                >
                  {c.name}
                </button>
              ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Price</p>
          <div className="flex gap-2">
            <Input
              placeholder="Min"
              type="number"
              value={minPrice}
              onChange={(e) => update({ minPrice: e.target.value })}
            />
            <Input
              placeholder="Max"
              type="number"
              value={maxPrice}
              onChange={(e) => update({ maxPrice: e.target.value })}
            />
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ search });
            }}
          >
            <Input
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[220px]"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <Dropdown
            className="w-48"
            value={sort}
            onChange={(v) => update({ sort: v })}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price_asc', label: 'Price: low to high' },
              { value: 'price_desc', label: 'Price: high to low' },
              { value: 'popularity', label: 'Popularity' },
            ]}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)
            : data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= meta.totalPages}
            onClick={() => update({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
