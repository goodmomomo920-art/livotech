import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  BarChart3, Bell, CreditCard, Download, FileText, Home, LifeBuoy,
  LogOut, Menu, Package, Puzzle, Receipt, Search, Settings,
  ShieldCheck, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Overview', to: '/dashboard', icon: BarChart3 },
  { label: 'My Products', to: '/dashboard/products', icon: Package },
  { label: 'Websites', to: '/dashboard/websites', icon: FileText },
  { label: 'Systems', to: '/dashboard/systems', icon: BarChart3 },
  { label: 'Digital Products', to: '/dashboard/digital-products', icon: CreditCard },
  { label: 'Add-ons', to: '/dashboard/addons', icon: Puzzle },
  { label: 'Orders', to: '/dashboard/orders', icon: Receipt },
  { label: 'Subscriptions', to: '/dashboard/subscriptions', icon: CreditCard },
  { label: 'Billing', to: '/dashboard/billing', icon: Receipt },
  { label: 'Downloads', to: '/dashboard/downloads', icon: Download },
  { label: 'Support', to: '/dashboard/support', icon: LifeBuoy },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /></div>;
}

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="dash-shell">
      <aside className={`dash-sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <Link to="/"><BrandMark /><span>Livo<span className="brand-accent">Tech</span></span></Link>
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
          {isAdmin && (
            <Link to="/admin" className="dash-nav-item dash-nav-admin">
              <ShieldCheck size={17} />
              <span>Admin Dashboard</span>
            </Link>
          )}
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
            <Search size={15} />
            <input placeholder="Search..." />
          </div>
          <div className="dash-header-right">
            <button className="dash-icon-btn"><Bell size={17} /></button>
            <div className="dash-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="dash-avatar">{profile?.full_name?.[0] ?? 'U'}</div>
              <span>{profile?.full_name ?? 'User'}</span>
              <ChevronDown size={14} />
              {userMenuOpen && (
                <div className="dash-user-menu">
                  <Link to="/dashboard/settings"><Settings size={14} /> Settings</Link>
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
