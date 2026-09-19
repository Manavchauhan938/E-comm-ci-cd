import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui';
import { formatCurrency } from '../../lib/utils';

export function CartDrawer() {
  const open = useUiStore((s) => s.cartDrawerOpen);
  const close = useUiStore((s) => s.closeCartDrawer);
  const cart = useCartStore((s) => s.cart);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-slate-950/40" onClick={close} aria-label="Close cart" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-lift dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">Cart</h2>
          <button type="button" onClick={close} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!cart?.items?.length && (
            <p className="text-sm text-slate-500">Your cart is empty.</p>
          )}
          {cart?.items?.map((item) => (
            <div key={item.id} className="flex gap-3">
              <img
                src={item.product.images?.[0]}
                alt={item.product.name}
                className="h-16 w-16 rounded-xl object-cover"
                loading="lazy"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-sm text-slate-500">{formatCurrency(item.product.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border"
                    onClick={() => updateItem(item.id, Math.max(0, item.quantity - 1))}
                  >
                    -
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border"
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-auto text-xs text-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <div className="mb-4 flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(cart?.subtotal || 0)}</span>
          </div>
          <Link to="/cart" onClick={close}>
            <Button className="w-full" variant="outline">
              View cart
            </Button>
          </Link>
          <Link to="/checkout" onClick={close} className="mt-2 block">
            <Button className="w-full">Checkout</Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
