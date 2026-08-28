import { useEffect, useState } from 'react';
import { Plus, Puzzle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Addon } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export function AdminAddons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('addons')
        .select('*')
        .order('sort_order');
      setAddons(data as Addon[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="dash-page-header">
        <h1>Add-ons</h1>
        <button className="btn btn-dark btn-sm"><Plus size={14} /> Add Add-on</button>
      </div>
      {loading ? (
        <div className="dash-table"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : addons.length === 0 ? (
        <EmptyState icon={Puzzle} title="No add-ons yet" description="Add add-ons to extend your products." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Name</th><th>Price</th><th>Billing</th><th>Status</th></tr></thead>
            <tbody>
              {addons.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name}</b></td>
                  <td>${a.price.toFixed(2)}</td>
                  <td>{a.billing_interval ?? 'One-time'}</td>
                  <td><StatusBadge status={a.is_active ? 'active' : 'suspended'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
