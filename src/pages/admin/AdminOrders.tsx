import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      setOrders(data as Order[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="dash-page-header"><h1>Orders</h1></div>
      {loading ? (
        <div className="dash-table"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Receipt} title="No orders yet" description="Customer orders will appear here." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><b>{o.order_number}</b></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>{o.order_items?.length ?? 0}</td>
                  <td>${o.total.toFixed(2)}</td>
                  <td><StatusBadge status={o.payment_status} /></td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
