import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useUiStore } from '../store/uiStore';
import { Button, Card, Input } from '../components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const toast = useUiStore((s) => s.toast);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setDone(true);
      if (data.data?.devResetUrl) {
        toast({ type: 'info', message: 'Dev reset link logged — check API response' });
      }
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Request failed' });
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card className="w-full space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        {done ? (
          <p className="text-sm text-slate-500">If that email exists, a reset link has been sent.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        )}
        <Link to="/login" className="text-sm text-brand-600">
          Back to sign in
        </Link>
      </Card>
    </div>
  );
}
