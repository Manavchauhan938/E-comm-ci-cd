import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Badge, Button, Card, Input } from '../components/ui';
import { formatCurrency } from '../lib/utils';

const tabs = ['orders', 'profile', 'addresses'];

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const toast = useUiStore((s) => s.toast);
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchMe().then((u) => setProfile({ name: u.name, email: u.email, phone: u.phone || '' }));
    api.get('/orders').then((r) => setOrders(r.data.data || []));
    api.get('/addresses').then((r) => setAddresses(r.data.data || []));
  }, [fetchMe]);

  const statusTone = {
    PENDING: 'warning',
    PAID: 'brand',
    SHIPPED: 'brand',
    DELIVERED: 'success',
    CANCELLED: 'danger',
  };

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <aside className="w-48 shrink-0 space-y-1">
        <p className="mb-3 text-sm font-semibold">Account</p>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`block w-full rounded-xl px-3 py-2 text-left text-sm capitalize ${
              tab === t ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </aside>

      <div className="flex-1">
        {tab === 'orders' && (
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">Order history</h1>
            {!orders.length && <p className="text-slate-500">No orders yet.</p>}
            {orders.map((o) => (
              <Card key={o.id} className="flex items-center justify-between gap-4">
                <div>
                  <Link to={`/order-confirmation/${o.id}`} className="font-medium">
                    {o.orderNumber}
                  </Link>
                  <p className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone[o.status] || 'neutral'}>{o.status}</Badge>
                  <span className="font-medium">{formatCurrency(o.total)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'profile' && (
          <Card className="max-w-md space-y-3">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <Input label="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Input label="Email" value={profile.email} disabled />
            <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            <Button
              onClick={() => toast({ type: 'info', message: 'Profile update API can be extended next' })}
            >
              Save
            </Button>
            <p className="text-xs text-slate-500">Signed in as {user?.role}</p>
          </Card>
        )}

        {tab === 'addresses' && (
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">Addresses</h1>
            {addresses.map((a) => (
              <Card key={a.id}>
                <p className="font-medium">{a.fullName}</p>
                <p className="text-sm text-slate-500">
                  {a.line1}, {a.city}, {a.state} {a.postalCode}
                </p>
                {a.isDefault && <Badge tone="brand">Default</Badge>}
              </Card>
            ))}
            {!addresses.length && <p className="text-slate-500">No saved addresses.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
