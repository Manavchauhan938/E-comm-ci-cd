import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useUiStore } from '../store/uiStore';
import { Button, Card, Input } from '../components/ui';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const toast = useUiStore((s) => s.toast);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password });
      toast({ type: 'success', message: 'Password updated' });
      navigate('/login');
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Reset failed' });
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card className="w-full space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
