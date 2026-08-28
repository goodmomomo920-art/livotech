import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SupportTicket } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export function DashboardSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setTickets(data as SupportTicket[] ?? []);
      setLoading(false);
    })();
  }, []);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from('support_tickets')
      .insert({ user_id: userId, subject, category, priority: 'normal', status: 'open' })
      .select('*')
      .single();
    if (data) {
      await supabase.from('support_messages').insert({ ticket_id: data.id, user_id: userId, message, is_staff: false });
      setTickets([data as SupportTicket, ...tickets]);
    }
    setShowForm(false);
    setSubject('');
    setMessage('');
  };

  return (
    <div>
      <div className="dash-page-header">
        <h1>Support</h1>
        <button className="btn btn-dark btn-sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> New Ticket</button>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="dash-form-card">
          <h3>Create a support ticket</h3>
          <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" required /></label>
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="product">Product</option>
            </select>
          </label>
          <label>Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe your issue in detail" required /></label>
          <button type="submit" className="btn btn-dark btn-sm">Submit Ticket <Send size={13} /></button>
        </form>
      )}

      {loading ? (
        <div className="dash-loading">Loading...</div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets" description="Need help? Create a ticket and our team will assist you." />
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>Subject</th><th>Category</th><th>Priority</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td><b>{t.subject}</b></td>
                  <td>{t.category ?? '—'}</td>
                  <td><span className="capitalize">{t.priority}</span></td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
