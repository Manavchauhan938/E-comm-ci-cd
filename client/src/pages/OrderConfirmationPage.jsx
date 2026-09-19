import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { Badge, Button, Card, Skeleton } from '../components/ui';
import { formatCurrency } from '../lib/utils';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data.data));
  }, [id]);

  if (!order) return <Skeleton className="mx-auto mt-10 h-64 max-w-xl" />;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card className="space-y-4 text-center">
        <Badge tone="success">Order confirmed</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
        <p className="text-sm text-slate-500">
          Status: {order.status} · Total {formatCurrency(order.total)}
        </p>
        <p className="text-sm text-slate-500">Estimated delivery in 3–5 business days.</p>
        <ul className="space-y-2 text-left text-sm">
          {order.items?.map((i) => (
            <li key={i.id} className="flex justify-between border-b py-2">
              <span>
                {i.productName} × {i.quantity}
              </span>
              <span>{formatCurrency(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <Link to="/account">
          <Button>View orders</Button>
        </Link>
      </Card>
    </div>
  );
}
