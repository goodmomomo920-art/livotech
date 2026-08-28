import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
      setCustomers(data as Profile[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="dash-page-header"><h1>Customers</h1></div>
      {loading ? (
        <div className="dash-table"><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" description="Customer accounts will appear here once they register." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Joined</th><th>Status</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.full_name ?? 'Unknown'}</b></td>
                  <td>{c.email ?? '—'}</td>
                  <td>{c.company ?? '—'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
