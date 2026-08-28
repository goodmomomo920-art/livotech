import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Download as DownloadType } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';

export function DashboardDownloads() {
  const [downloads, setDownloads] = useState<DownloadType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('downloads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setDownloads(data as DownloadType[] ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="dash-page-header"><h1>Downloads</h1></div>
      {loading ? (
        <div className="dash-table"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : downloads.length === 0 ? (
        <EmptyState icon={Download} title="No downloads yet" description="Your purchased downloads will appear here." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>File</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {downloads.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.file_name ?? 'File'}</b></td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-light btn-sm"><Download size={13} /> Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
