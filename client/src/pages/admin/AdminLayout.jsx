import { useEffect, useState } from 'react';
import { NavLink, Outlet, Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  Settings,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../lib/api';
import { Badge, Button, Card, Input, Modal, Skeleton } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';

const nav = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminShell() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:block">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</p>
        <nav className="space-y-1">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
}

function DashboardHome() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/orders', { params: { limit: 50 } }),
      api.get('/products', { params: { limit: 100, isActive: 'true' } }),
    ])
      .then(([o, p]) => {
        setOrders(o.data.data || []);
        setProducts(p.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const revenue = orders
    .filter((o) => ['PAID', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((s, o) => s + Number(o.total), 0);
  const lowStock = products.filter((p) => p.stockQuantity < 10);

  const chartData = Object.values(
    orders.reduce((acc, o) => {
      const day = new Date(o.createdAt).toLocaleDateString();
      acc[day] = acc[day] || { day, sales: 0 };
      acc[day].sales += Number(o.total);
      return acc;
    }, {})
  ).slice(-14);

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Revenue', formatCurrency(revenue)],
          ['Orders', String(orders.length)],
          ['Products', String(products.length)],
          ['Low stock', String(lowStock.length)],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <p className="mb-4 font-medium">Sales over time</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="sales" stroke="#006fc7" fill="#e0effe" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      {lowStock.length > 0 && (
        <Card>
          <p className="mb-3 font-medium">Low-stock alerts</p>
          <ul className="space-y-2 text-sm">
            {lowStock.slice(0, 8).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <Badge tone="warning">{p.stockQuantity} left</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '10',
    sku: '',
    categoryId: '',
  });
  const [categories, setCategories] = useState([]);
  const toast = useUiStore((s) => s.toast);

  const load = () => api.get('/products', { params: { limit: 50 } }).then((r) => setProducts(r.data.data || []));

  useEffect(() => {
    load();
    api.get('/categories').then((r) => setCategories(r.data.data || []));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        ...form,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categoryId: form.categoryId || categories[0]?.id,
      });
      toast({ type: 'success', message: 'Product created' });
      setOpen(false);
      load();
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const remove = async (id) => {
    if (!confirm('Soft-delete this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button onClick={() => setOpen(true)}>Add product</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.sku}</td>
                <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3">{p.stockQuantity}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New product">
        <form onSubmit={create} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <Input label="Price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Stock" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Category</span>
            <select
              className="h-11 w-full rounded-xl border px-3"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const toast = useUiStore((s) => s.toast);

  const load = () =>
    api.get('/admin/orders', { params: { limit: 50, status: status || undefined } }).then((r) => setOrders(r.data.data || []));

  useEffect(() => {
    load();
  }, [status]);

  const updateStatus = async (id, next) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: next });
      toast({ type: 'success', message: 'Status updated' });
      load();
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Update failed' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <select className="h-10 rounded-xl border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3">{o.user?.email}</td>
                <td className="px-4 py-3">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border px-2 py-1"
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    {['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const toast = useUiStore((s) => s.toast);

  const load = () => api.get('/categories?all=true').then((r) => setCategories(r.data.data || []));
  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', { name });
      setName('');
      load();
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <form onSubmit={create} className="flex max-w-md gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required />
        <Button type="submit">Add</Button>
      </form>
      <ul className="space-y-2">
        {categories.map((c) => (
          <Card key={c.id} className="flex justify-between py-3">
            <span>{c.name}</span>
            <span className="text-sm text-slate-500">{c.slug}</span>
          </Card>
        ))}
      </ul>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-500">Placeholder — extend with full CRUD as needed.</p>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<DashboardHome />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<Placeholder title="Customers" />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
