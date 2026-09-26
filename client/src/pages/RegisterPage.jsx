import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import { Button, Card, Input } from '../components/ui';

export default function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const toast = useUiStore((s) => s.toast);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      await fetchCart();
      navigate('/');
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card className="w-full space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <p className="text-xs text-slate-500">Min 8 chars with upper, lower, and number.</p>
          <Button type="submit" className="w-full" loading={loading}>
            Register
          </Button>
        </form>
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
