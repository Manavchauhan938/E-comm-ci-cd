import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">E-Comm</p>
          <p className="mt-2 text-sm text-slate-500">Modern commerce for ambitious brands.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Shop</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500">
            <Link to="/products">All products</Link>
            <Link to="/products?category=electronics">Electronics</Link>
            <Link to="/products?category=apparel">Apparel</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500">
            <a href="#newsletter">Newsletter</a>
            <Link to="/account">Account</Link>
            <Link to="/styleguide">Style guide</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Payments</p>
          <p className="mt-3 text-sm text-slate-500">Visa · Mastercard · Amex · Stripe</p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} E-Comm. All rights reserved.
      </div>
    </footer>
  );
}
