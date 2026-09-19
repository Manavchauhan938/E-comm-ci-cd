import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Button, Card } from '../components/ui';
import { formatCurrency } from '../lib/utils';

export default function CartPage() {
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px] sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
        <div className="mt-6 space-y-4">
          {!cart?.items?.length && <p className="text-slate-500">Cart is empty.</p>}
          {cart?.items?.map((item) => (
            <Card key={item.id} className="flex gap-4">
              <img
                src={item.product.images?.[0]}
                alt={item.product.name}
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <Link to={`/products/${item.product.slug}`} className="font-medium">
                  {item.product.name}
                </Link>
                <p className="text-sm text-slate-500">{formatCurrency(item.product.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" className="h-8 w-8 rounded-lg border" onClick={() => updateItem(item.id, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" className="h-8 w-8 rounded-lg border" onClick={() => updateItem(item.id, item.quantity + 1)}>
                    +
                  </button>
                  <button type="button" className="ml-auto text-sm text-danger" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Card className="h-fit space-y-3">
        <h2 className="font-semibold">Summary</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(cart?.subtotal || 0)}</span>
        </div>
        <p className="text-xs text-slate-500">Tax and shipping calculated at checkout.</p>
        <Link to="/checkout">
          <Button className="w-full" disabled={!cart?.items?.length}>
            Checkout
          </Button>
        </Link>
      </Card>
    </div>
  );
}
