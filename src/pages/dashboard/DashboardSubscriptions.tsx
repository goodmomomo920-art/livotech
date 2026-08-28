import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export function DashboardSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('*, products(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setSubs(data as Subscription[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="dash-page-header"><h1>Subscriptions</h1></div>
      {loading ? (
        <div className="dash-table"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : subs.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions" description="You don't have any active subscriptions." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Product</th><th>Plan</th><th>Price</th><th>Billing</th><th>Next Billing</th><th>Status</th></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.products?.name ?? 'Product'}</b></td>
                  <td>{s.plan ?? '—'}</td>
                  <td>${s.price.toFixed(2)}</td>
                  <td>{s.billing_interval ?? '—'}</td>
                  <td>{s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString() : '—'}</td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
