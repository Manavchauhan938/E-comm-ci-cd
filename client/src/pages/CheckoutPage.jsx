import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import { Button, Card, Input } from '../components/ui';
import { formatCurrency } from '../lib/utils';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const addressSchema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2).default('US'),
  phone: z.string().optional(),
});

function PaymentStep({ orderId, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const toast = useUiStore((s) => s.toast);

  const pay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error) {
        toast({ type: 'error', message: error.message });
        return;
      }
      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        await api.post('/payments/confirm', { orderId });
        onPaid(orderId);
        return;
      }
      toast({ type: 'error', message: 'Payment was not completed. Please try again.' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Payment failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={pay} className="space-y-4">
      <PaymentElement />
      <Button type="submit" loading={loading} className="w-full">
        Pay now
      </Button>
      <p className="text-center text-xs text-slate-500">
        Test card: 4242 4242 4242 4242 · any future expiry · any CVC
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore((s) => s.cart);
  const guestId = useCartStore((s) => s.guestId);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const toast = useUiStore((s) => s.toast);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [placing, setPlacing] = useState(false);

  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'US' },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    fetchCart();
    api.get('/addresses').then((r) => {
      setAddresses(r.data.data || []);
      const def = r.data.data?.find((a) => a.isDefault) || r.data.data?.[0];
      if (def) setSelectedAddress(def.id);
    });
  }, [user, navigate, fetchCart]);

  const saveAddress = async (values) => {
    const { data } = await api.post('/addresses', { ...values, type: 'SHIPPING', isDefault: true });
    setAddresses((a) => [data.data, ...a]);
    setSelectedAddress(data.data.id);
    setStep(2);
  };

  const createOrder = async () => {
    setPlacing(true);
    try {
      // Pass guestId so any pre-login cart items are merged into the user cart
      const { data } = await api.post('/orders', {
        shippingAddressId: selectedAddress,
        couponCode: coupon || undefined,
        guestId: guestId || undefined,
      });
      setOrder(data.data);
      await fetchCart();
      const intent = await api.post('/payments/create-intent', { orderId: data.data.id });
      setClientSecret(intent.data.data.clientSecret);
      setStep(3);
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Checkout failed' });
    } finally {
      setPlacing(false);
    }
  };

  if (!cart?.items?.length && step < 3) {
    return <p className="p-10 text-center text-slate-500">Add items to your cart before checkout.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <div className="mt-4 flex gap-2 text-sm">
        {['Shipping', 'Review', 'Payment'].map((label, i) => (
          <span
            key={label}
            className={`rounded-lg px-3 py-1 ${step === i + 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <Card className="mt-6 space-y-4">
          {addresses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Saved addresses</p>
              {addresses.map((a) => (
                <label key={a.id} className="flex cursor-pointer gap-2 rounded-xl border p-3 text-sm">
                  <input
                    type="radio"
                    checked={selectedAddress === a.id}
                    onChange={() => setSelectedAddress(a.id)}
                  />
                  <span>
                    {a.fullName} — {a.line1}, {a.city}
                  </span>
                </label>
              ))}
              <Button onClick={() => setStep(2)} disabled={!selectedAddress}>
                Continue
              </Button>
            </div>
          )}
          <form onSubmit={form.handleSubmit(saveAddress)} className="grid gap-3 sm:grid-cols-2">
            <Input label="Full name" {...form.register('fullName')} error={form.formState.errors.fullName?.message} />
            <Input label="Phone" {...form.register('phone')} />
            <Input label="Address" className="sm:col-span-2" {...form.register('line1')} error={form.formState.errors.line1?.message} />
            <Input label="Apt / suite" className="sm:col-span-2" {...form.register('line2')} />
            <Input label="City" {...form.register('city')} />
            <Input label="State" {...form.register('state')} />
            <Input label="Postal code" {...form.register('postalCode')} />
            <Input label="Country" {...form.register('country')} />
            <Button type="submit" className="sm:col-span-2">
              Save & continue
            </Button>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card className="mt-6 space-y-4">
          <div className="space-y-2 text-sm">
            {cart.items.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>
                  {i.product.name} × {i.quantity}
                </span>
                <span>{formatCurrency(i.lineTotal)}</span>
              </div>
            ))}
          </div>
          <Input label="Promo code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          <div className="flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={createOrder} loading={placing}>
              Place order & pay
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && clientSecret && (
        <Card className="mt-6">
          <p className="mb-4 text-sm text-slate-500">
            Order {order?.orderNumber} · {formatCurrency(order?.total)}
          </p>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentStep
              orderId={order.id}
              onPaid={(id) => navigate(`/order-confirmation/${id}`)}
            />
          </Elements>
        </Card>
      )}
    </div>
  );
}
