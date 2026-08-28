import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, FileText, Globe2, Heart, LayoutDashboard, ShoppingCart, Store } from 'lucide-react';

const solutions = [
  { name: 'Pharmacies', desc: 'Online ordering, prescription management, and delivery integration.', icon: Store, color: 'bg-teal-50 text-teal-700' },
  { name: 'Restaurants', desc: 'Menu display, table reservations, and online ordering.', icon: Heart, color: 'bg-amber-50 text-amber-700' },
  { name: 'Clinics', desc: 'Appointment booking, doctor profiles, and patient reviews.', icon: Heart, color: 'bg-sky-50 text-sky-700' },
  { name: 'Retail', desc: 'POS systems, inventory management, and sales tracking.', icon: BriefcaseBusiness, color: 'bg-blue-50 text-blue-700' },
  { name: 'E-commerce', desc: 'Product catalogs, secure checkout, and order management.', icon: ShoppingCart, color: 'bg-rose-50 text-rose-700' },
  { name: 'Other Businesses', desc: 'Custom solutions tailored to your specific needs.', icon: LayoutDashboard, color: 'bg-violet-50 text-violet-700' },
];

export function SolutionsPage() {
  return (
    <div className="page-wrap section-wrap">
      <div className="page-header">
        <p className="eyebrow">Solutions</p>
        <h1>Solutions for every business</h1>
        <p className="page-subtitle">No matter your industry, LivoTech has the digital products and tools to help you grow.</p>
      </div>
      <div className="solutions-grid">
        {solutions.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.name} className="solution-card-detail">
              <div className={`solution-icon ${s.color}`}><Icon size={28} /></div>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
              <Link to="/products" className="text-link">Explore products <ArrowRight size={13} /></Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
