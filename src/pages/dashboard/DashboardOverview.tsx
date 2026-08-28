import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Download, Package, Receipt, ArrowRight, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { CustomerProduct, Order, Subscription, Notification } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export function DashboardOverview() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [downloads, setDownloads] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      const [{ data: prods }, { data: ords }, { data: subs }, { data: notifs }, { count }] = await Promise.all([
        supabase.from('customer_products').select('*, products(*, product_types(*), categories(*))').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('*, products(*)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('downloads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setProducts(prods as CustomerProduct[] ?? []);
      setOrders(ords as Order[] ?? []);
      setSubscriptions(subs as Subscription[] ?? []);
      setNotifications(notifs as Notification[] ?? []);
      setDownloads(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const stats = [
    { label: 'Active Products', value: products.length, icon: Package, color: 'stat-teal' },
    { label: 'Active Subscriptions', value: subscriptions.filter(s => s.status === 'active').length, icon: CreditCard, color: 'stat-blue' },
    { label: 'Total Orders', value: orders.length, icon: Receipt, color: 'stat-amber' },
    { label: 'Available Downloads', value: downloads, icon: Download, color: 'stat-green' },
  ];

  if (loading) return <div className="dash-loading">Loading...</div>;

  return (
    <div>
      <div className="dash-welcome">
        <h1>Welcome back, {profile?.full_name ?? 'User'}</h1>
        <p>Here's what's happening with your account.</p>
      </div>

      <div className="stat-grid">
        {stats.map((s) => {
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
          <div className="dash-panel-header"><h2>My Products</h2><Link to="/dashboard/products" className="text-link">View all <ArrowRight size={13} /></Link></div>
          {products.length === 0 ? (
            <EmptyState icon={Package} title="No products yet" description="You haven't purchased any products yet." action={<Link to="/products" className="btn btn-dark btn-sm">Explore Products</Link>} />
          ) : (
            <div className="dash-product-list">
              {products.map((cp) => (
                <div key={cp.id} className="dash-product-item">
                  {cp.products?.thumbnail && <img src={cp.products.thumbnail} alt="" />}
                  <div className="dash-product-info">
                    <b>{cp.products?.name}</b>
                    <span>{cp.products?.product_types?.name}</span>
                  </div>
                  <StatusBadge status={cp.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-header"><h2>Recent Orders</h2><Link to="/dashboard/orders" className="text-link">View all <ArrowRight size={13} /></Link></div>
          {orders.length === 0 ? (
            <EmptyState icon={Receipt} title="No orders yet" description="Your orders will appear here." />
          ) : (
            <div className="dash-order-list">
              {orders.map((o) => (
                <div key={o.id} className="dash-order-item">
                  <b>{o.order_number}</b>
                  <span>${o.total.toFixed(2)}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-section-grid">
        <div className="dash-panel">
          <div className="dash-panel-header"><h2>Recent Activity</h2></div>
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No activity yet" description="Your recent activity will appear here." />
          ) : (
            <div className="dash-notif-list">
              {notifications.map((n) => (
                <div key={n.id} className="dash-notif-item">
                  <div className={`dash-notif-dot ${n.is_read ? 'read' : 'unread'}`} />
                  <div><b>{n.title}</b>{n.message && <p>{n.message}</p>}</div>
                  <small>{new Date(n.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-header"><h2>Subscriptions</h2><Link to="/dashboard/subscriptions" className="text-link">View all <ArrowRight size={13} /></Link></div>
          {subscriptions.length === 0 ? (
            <EmptyState icon={CreditCard} title="No subscriptions" description="You don't have any active subscriptions." />
          ) : (
            <div className="dash-sub-list">
              {subscriptions.map((s) => (
                <div key={s.id} className="dash-sub-item">
                  <b>{s.products?.name ?? 'Product'}</b>
                  <span>${s.price}/{s.billing_interval}</span>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
