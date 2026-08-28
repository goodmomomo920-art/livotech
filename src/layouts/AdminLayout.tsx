import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  BarChart3, Bell, ChevronDown, CreditCard, FileText, Home, LogOut,
  Menu, Package, Puzzle, Receipt, Settings, Shield, ShieldCheck,
  Tag, Users, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { label: 'Overview', to: '/admin', icon: Home },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Add-ons', to: '/admin/addons', icon: Puzzle },
  { label: 'Orders', to: '/admin/orders', icon: Receipt },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'Coupons', to: '/admin/coupons', icon: Tag },
  { label: 'Support', to: '/admin/support', icon: Shield },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldCheck },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /></div>;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="dash-shell admin-shell">
      <aside className={`dash-sidebar admin-sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <Link to="/admin"><BrandMark /><span>Livo<span className="brand-accent">Tech</span></span><small>Admin</small></Link>
        </div>
        <nav className="dash-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`dash-nav-item ${active ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button className="dash-signout" onClick={handleSignOut}>
          <LogOut size={17} /> Sign Out
        </button>
      </aside>

      {drawerOpen && <div className="dash-overlay" onClick={() => setDrawerOpen(false)} />}

      <div className="dash-main">
        <header className="dash-header">
          <button className="dash-menu-btn" onClick={() => setDrawerOpen(!drawerOpen)}>
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="dash-search">
            <input placeholder="Search admin..." />
          </div>
          <div className="dash-header-right">
            <button className="dash-icon-btn"><Bell size={17} /></button>
            <div className="dash-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="dash-avatar admin-avatar">{profile?.full_name?.[0] ?? 'A'}</div>
              <span>{profile?.full_name ?? 'Admin'}</span>
              <ChevronDown size={14} />
              {userMenuOpen && (
                <div className="dash-user-menu">
                  <Link to="/admin/settings"><Settings size={14} /> Settings</Link>
                  <button onClick={handleSignOut}><LogOut size={14} /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
