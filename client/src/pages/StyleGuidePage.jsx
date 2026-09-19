import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Dropdown,
  Skeleton,
} from '../components/ui';
import { useUiStore } from '../store/uiStore';

export default function StyleGuidePage() {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState('newest');
  const toast = useUiStore((s) => s.toast);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);

  useEffect(() => {
    document.title = 'Style Guide — E-Comm';
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6">
      <Helmet>
        <title>Style Guide — E-Comm</title>
      </Helmet>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Design system</h1>
        <p className="mt-2 text-slate-500">Reusable primitives for the storefront and admin.</p>
        <Button className="mt-4" variant="outline" onClick={toggleDarkMode}>
          Toggle dark mode
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Colors</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['brand-600', 'slate-900', 'success', 'danger'].map((c) => (
            <div key={c} className="overflow-hidden rounded-2xl border">
              <div className={`h-16 bg-${c === 'brand-600' ? 'brand-600' : c === 'slate-900' ? 'slate-900' : c}`} />
              <p className="p-2 text-xs">{c}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-12 w-24 rounded-xl bg-brand-600" title="brand" />
          <div className="h-12 w-24 rounded-xl bg-slate-900" title="ink" />
          <div className="h-12 w-24 rounded-xl bg-success" title="success" />
          <div className="h-12 w-24 rounded-xl bg-warning" title="warning" />
          <div className="h-12 w-24 rounded-xl bg-danger" title="danger" />
          <div className="h-12 w-24 rounded-xl bg-slate-100 border" title="neutral" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs & dropdown</h2>
        <div className="grid max-w-md gap-3">
          <Input label="Email" placeholder="you@example.com" />
          <Input label="With error" error="Required field" />
          <Dropdown
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'price_asc', label: 'Price: low to high' },
            ]}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card, badge, skeleton</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-medium">Inventory alert</p>
              <Badge tone="warning">Low stock</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">3 SKUs below threshold.</p>
          </Card>
          <Skeleton className="h-28" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Modal & toast</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setOpen(true)}>Open modal</Button>
          <Button variant="outline" onClick={() => toast({ type: 'success', message: 'Saved successfully' })}>
            Show toast
          </Button>
        </div>
        <Modal open={open} onClose={() => setOpen(false)} title="Confirm action">
          <p className="text-sm text-slate-500">This is a sample modal dialog.</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </div>
        </Modal>
      </section>
    </div>
  );
}
