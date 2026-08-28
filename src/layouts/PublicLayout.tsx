import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, Bell, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /></div>;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Products', to: '/products' },
    { label: 'Solutions', to: '/solutions' },
    { label: 'Add-ons', to: '/addons' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <div className="site-shell">
      <header className="navbar">
        <Link className="brand" to="/" aria-label="LivoTech home"><BrandMark /><span>Livo<span className="brand-accent">Tech</span></span></Link>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'nav-active' : ''}>{item.label}</Link>
          ))}
          <div className="mobile-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-dark btn-md">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-light btn-md">Login</Link>
                <Link to="/register" className="btn btn-dark btn-md">Get Started</Link>
              </>
            )}
          </div>
        </nav>
        <div className="desktop-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-dark btn-md">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-light btn-md">Login</Link>
              <Link to="/register" className="btn btn-dark btn-md">Get Started</Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer section-wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="brand" to="/"><BrandMark /><span>Livo<span className="brand-accent">Tech</span></span></Link>
            <p>Digital products,<br />tools & solutions.</p>
            <div className="socials"><span>f</span><span>in</span><span>◎</span><span>◉</span></div>
          </div>
          <div className="footer-column"><b>Products</b><Link to="/products">All Products</Link><Link to="/products?cat=websites">Websites</Link><Link to="/products?cat=business-systems">Business Systems</Link><Link to="/addons">Add-ons</Link></div>
          <div className="footer-column"><b>Company</b><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/faq">FAQ</Link></div>
          <div className="footer-column"><b>Account</b><Link to="/login">Login</Link><Link to="/register">Create Account</Link><Link to="/dashboard">Dashboard</Link></div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 LivoTech. All rights reserved.</span>
          <div><span>Privacy Policy</span><span>Terms of Service</span><span>Refund Policy</span></div>
        </div>
      </footer>
    </div>
  );
}
