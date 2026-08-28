import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Package, ShoppingCart, Users, FileText, Globe, LifeBuoy, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AdminOverview() {
  const [stats, setStats] = useState({ customers: 0, subscriptions: 0, orders: 0, revenue: 0, products: 0, digitalProducts: 0, websites: 0, tickets: 0 });
  const [recentOrders, setRecentOrders] = useState<{ order_number: string; total: number; status: string; created_at: string }[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<{ full_name: string | null; email: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [cust, subs, ords, prods, dprods, webs, tix, rev, ro, rc] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_downloadable', true),
        supabase.from('websites').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('orders').select('total'),
        supabase.from('orders').select('order_number, total, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('full_name, email, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const revenue = (rev.data ?? []).reduce((sum: number, o: { total: number }) => sum + o.total, 0);

      setStats({
        customers: cust.count ?? 0,
        subscriptions: subs.count ?? 0,
        orders: ords.count ?? 0,
        revenue,
        products: prods.count ?? 0,
        digitalProducts: dprods.count ?? 0,
        websites: webs.count ?? 0,
        tickets: tix.count ?? 0,
      });
      setRecentOrders(ro.data as typeof recentOrders ?? []);
      setRecentCustomers(rc.data as typeof recentCustomers ?? []);
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'stat-teal' },
    { label: 'Active Subscriptions', value: stats.subscriptions, icon: CreditCard, color: 'stat-blue' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'stat-amber' },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'stat-green' },
    { label: 'Active Products', value: stats.products, icon: Package, color: 'stat-teal' },
    { label: 'Digital Products', value: stats.digitalProducts, icon: FileText, color: 'stat-blue' },
    { label: 'Websites', value: stats.websites, icon: Globe, color: 'stat-amber' },
    { label: 'Pending Tickets', value: stats.tickets, icon: LifeBuoy, color: 'stat-green' },
  ];

  if (loading) return <div className="dash-loading">Loading...</div>;

  return (
    <div>
      <div className="dash-welcome"><h1>Admin Overview</h1><p>Platform statistics and recent activity.</p></div>
      <div className="stat-grid">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon"><Icon size={22} /></div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          );
        })}
      </div>

      <div className="dash-section-grid">
        <div className="dash-panel">
          <div className="dash-panel-header"><h2>Recent Orders</h2><TrendingUp size={18} /></div>
          {recentOrders.length === 0 ? (
            <div className="dash-empty">No orders yet</div>
          ) : (
            <div className="dash-order-list">
              {recentOrders.map((o, i) => (
                <div key={i} className="dash-order-item">
                  <b>{o.order_number}</b><span>${o.total.toFixed(2)}</span><span className="capitalize">{o.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dash-panel">
          <div className="dash-panel-header"><h2>Recent Customers</h2><Users size={18} /></div>
          {recentCustomers.length === 0 ? (
            <div className="dash-empty">No customers yet</div>
          ) : (
            <div className="dash-order-list">
              {recentCustomers.map((c, i) => (
                <div key={i} className="dash-order-item">
                  <b>{c.full_name ?? 'Unknown'}</b><span>{c.email ?? '—'}</span><small>{new Date(c.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
