import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminActivityLog } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setLogs(data as AdminActivityLog[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="dash-page-header"><h1>Audit Logs</h1></div>
      {loading ? (
        <div className="dash-table"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No activity logged" description="Admin actions will be recorded here." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Action</th><th>Resource</th><th>Resource ID</th><th>Date</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td><b>{l.action}</b></td>
                  <td>{l.resource ?? '—'}</td>
                  <td>{l.resource_id ?? '—'}</td>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
