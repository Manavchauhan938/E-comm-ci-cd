import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import api from '../lib/api';
import { Button, Input, Skeleton } from '../components/ui';
import { ProductCard } from '../components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/products', { params: { limit: 4, sort: 'newest' } }),
      api.get('/categories'),
    ])
      .then(([p, c]) => {
        setProducts(p.data.data || []);
        setCategories((c.data.data || []).filter((x) => !x.parentId).slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>E-Comm — Modern commerce</title>
        <meta name="description" content="Shop curated products with a Stripe-grade experience." />
      </Helmet>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#dbeafe_0%,_transparent_55%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(ellipse_at_top_right,_#0b3f6e_0%,_transparent_50%),linear-gradient(180deg,#0b1220_0%,#111827_100%)]" />
        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-semibold tracking-[0.2em] text-brand-600 uppercase">E-Comm</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-slate-900 text-balance sm:text-5xl dark:text-white">
              Commerce that feels effortless
            </h1>
            <p className="mt-4 max-w-md text-base text-slate-600 dark:text-slate-300">
              A modern storefront with fast checkout, clear pricing, and products people love.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products">
                <Button size="lg">Shop now</Button>
              </Link>
              <Link to="/products?sort=newest">
                <Button size="lg" variant="outline">
                  New arrivals
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"
              alt="Curated retail lifestyle display"
              className="h-[420px] w-full rounded-none object-cover shadow-lift lg:h-[520px]"
              fetchPriority="high"
            />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold tracking-tight">Featured products</h2>
          <p className="mt-1 text-sm text-slate-500">Hand-picked for this week</p>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Shop by category</h2>
          <p className="mt-1 text-sm text-slate-400">Find what you need, faster</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
              >
                <p className="font-medium">{c.name}</p>
                <p className="mt-1 text-sm text-slate-400">{c._count?.products || 0} products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Loved by customers</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['“Checkout was absurdly smooth.”', 'Alex R.'],
            ['“Product quality matched the photos.”', 'Jordan M.'],
            ['“Support resolved my issue in minutes.”', 'Sam T.'],
          ].map(([quote, name]) => (
            <blockquote
              key={name}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-slate-700 dark:text-slate-200">{quote}</p>
              <footer className="mt-4 text-sm text-slate-500">{name}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="newsletter" className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Stay in the loop</h2>
          <p className="mt-2 text-sm text-slate-500">New drops and early access — no spam.</p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setEmail('');
            }}
          >
            <Input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </>
  );
}
