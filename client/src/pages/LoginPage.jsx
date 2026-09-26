import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import { Button, Card, Input } from '../components/ui';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const toast = useUiStore((s) => s.toast);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // Merge guest cart into the signed-in user cart
      await fetchCart();
      navigate(location.state?.from || '/');
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card className="w-full space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>
        <p className="text-sm text-slate-500">
          <Link to="/forgot-password" className="text-brand-600">
            Forgot password?
          </Link>
          {' · '}
          <Link to="/register" className="text-brand-600">
            Create account
          </Link>
        </p>
      </Card>
    </div>
  );
}
