import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowRight, BarChart3, Bell, BookOpen, BriefcaseBusiness, Check,
  ChevronRight, Clock3, Code2, CreditCard, Database, FileText,
  Globe2, Heart, LayoutDashboard, LifeBuoy, Package, Puzzle, Rocket,
  Search, Settings2, ShieldCheck, ShoppingCart, Sparkles, Store,
  TrendingUp, Users, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /></div>;
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && <Link to="/products" className="text-action">{action}<ArrowRight size={14} /></Link>}
    </div>
  );
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: featured }, { data: prods }, { data: cats }] = await Promise.all([
        supabase
          .from('products')
          .select('*, product_types(*), categories(*)')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('sort_order')
          .limit(8),
        supabase
          .from('products')
          .select('*, product_types(*), categories(*)')
          .eq('is_active', true)
          .order('sort_order')
          .limit(6),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
          .limit(5),
      ]);
      setProducts((featured ?? prods ?? []) as Product[]);
      setCategories(cats as Category[] ?? []);
      setLoading(false);
    })();
  }, []);

  const categoryIcons: Record<string, typeof Globe2> = {
    websites: Globe2,
    'business-systems': BarChart3,
    saas: BriefcaseBusiness,
    'digital-products': FileText,
    templates: LayoutDashboard,
    ebooks: BookOpen,
    tools: Settings2,
  };

  const solutions = ['Pharmacies', 'Restaurants', 'Clinics', 'Retail', 'E-commerce', 'Other Businesses'];
  const solutionIcons = [Store, Heart, Heart, ShoppingCart, LayoutDashboard, BriefcaseBusiness];
  const addons = ['Loyalty Points', 'Coupons', 'Push Notifications', 'Reviews', 'Wishlist', 'Delivery Management', 'Advanced Staff Permissions'];
  const addonIcons = [Sparkles, CreditCard, Bell, Heart, Heart, Rocket, ShieldCheck];

  return (
    <div className="site-shell">
      <section className="hero section-wrap">
        <div className="hero-copy">
          <div className="pill"><Sparkles size={13} /> Built for modern teams</div>
          <h1>Digital products,<br />tools & <span>solutions.</span></h1>
          <p>Everything you need to build, launch and grow your digital presence — from ready-made websites and business systems to digital products and tools.</p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-dark btn-lg">Explore Products <ArrowRight size={16} /></Link>
            <Link to="/solutions" className="btn btn-outline btn-lg">View Solutions <ArrowRight size={16} /></Link>
          </div>
          <div className="trust-row">
            <span><ShieldCheck size={14} /> Secure</span>
            <span><Zap size={14} /> Reliable</span>
            <span><LifeBuoy size={14} /> Dedicated Support</span>
            <span><Clock3 size={14} /> Always Improving</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="LivoTech platform preview">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="hero-card card-web"><Globe2 size={18} /><b>Websites</b><small>Beautiful, ready-to-launch websites for any business</small><div className="mini-browser"><span /><span /><span /></div></div>
          <div className="hero-card card-pos"><CreditCard size={18} /><b>POS System</b><small>Powerful point of sale systems</small></div>
          <div className="hero-card card-inventory"><Database size={18} /><b>Inventory</b><small>Manage stock and track in real-time</small></div>
          <div className="hero-card card-addon"><Puzzle size={18} /><b>Add-ons</b><small>Extend your products with powerful add-ons</small></div>
          <div className="hero-card card-digital"><FileText size={18} /><b>Digital Products</b><small>Templates, tools, guides and more</small></div>
          <div className="hero-card card-system"><BarChart3 size={18} /><b>Business Systems</b><small>Complete systems to run your business</small></div>
          <div className="platform-preview"><div className="preview-top"><span /><span /><span /></div><div className="preview-sidebar"><i /><i /><i /><i /></div><div className="preview-content"><div className="preview-heading" /><div className="preview-bars"><i /><i /><i /><i /></div><div className="preview-chart"><TrendingUp size={22} /></div></div></div>
          <div className="hero-card card-all"><Check size={14} /><b>All in One Platform</b><small>Everything you need in one place</small></div>
        </div>
      </section>

      <section className="proof-strip">
        <div><ShieldCheck size={17} /><span>Secure by design</span></div>
        <div><Code2 size={17} /><span>Built to scale</span></div>
        <div><Users size={17} /><span>For every team</span></div>
        <div><Sparkles size={17} /><span>Always improving</span></div>
      </section>

      <section className="category-band">
        <p>Built for creators, businesses & digital teams.</p>
        <div className="category-links">
          <span><Globe2 size={18} /> Websites</span>
          <span><BriefcaseBusiness size={18} /> Business Systems</span>
          <span><FileText size={18} /> Digital Products</span>
          <span><Settings2 size={18} /> Tools</span>
        </div>
      </section>

      <section className="section-wrap section-block" id="products">
        <SectionHeading eyebrow="Explore LivoTech" title="Explore LivoTech" action="View all categories" />
        <p className="section-intro">Choose the tools, products and solutions that fit your needs.</p>
        <div className="category-grid">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.slug] ?? Globe2;
            return (
              <Link key={cat.id} to={`/products?cat=${cat.slug}`} className="category-card">
                <div className="category-icon"><Icon size={27} /></div>
                <h3>{cat.name}</h3>
                <p>{cat.description ?? ''}</p>
                <span className="round-arrow"><ArrowRight size={14} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section-wrap section-block">
        <SectionHeading eyebrow="Featured products" title="Explore some of the products available through LivoTech." action="View all products" />
        <div className="product-grid">
          {loading ? (
            <p className="section-intro">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="section-intro">No products available yet.</p>
          ) : (
            products.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>

      <section className="section-wrap section-block" id="solutions">
        <SectionHeading eyebrow="Solutions for every business" title="Solutions for every kind of business." />
        <div className="solution-grid">
          {solutions.map((solution, index) => {
            const Icon = solutionIcons[index];
            return <Link key={solution} to="/products" className="solution-card"><Icon size={29} /><span>{solution}</span></Link>;
          })}
        </div>
      </section>

      <section className="how-section section-wrap">
        <SectionHeading eyebrow="How it works" title="Simple steps to get started." />
        <div className="steps">
          <div className="step"><div className="step-icon"><Search size={24} /></div><span>01</span><div><b>Find the product</b><p>Find the product or solution you need.</p></div></div>
          <ChevronRight className="step-arrow" />
          <div className="step"><div className="step-icon"><FileText size={24} /></div><span>02</span><div><b>Choose your plan</b><p>Select the plan and add-ons that fit your requirements.</p></div></div>
          <ChevronRight className="step-arrow" />
          <div className="step"><div className="step-icon"><Rocket size={24} /></div><span>03</span><div><b>Get started</b><p>Activate your product and start using it.</p></div></div>
        </div>
      </section>

      <section className="section-wrap section-block addons-section" id="addons">
        <SectionHeading eyebrow="LivoTech add-ons" title="Make your product yours." action="View all add-ons" />
        <p className="section-intro">Extend your experience with powerful add-ons designed to work with your products.</p>
        <div className="addon-grid">
          {addons.map((addon, index) => {
            const Icon = addonIcons[index];
            return <Link key={addon} to="/addons" className="addon-card"><Icon size={21} /><span>{addon}</span></Link>;
          })}
        </div>
      </section>

      <section className="section-wrap section-block" id="resources">
        <SectionHeading eyebrow="More than software" title="Discover digital products." action="View all products" />
        <p className="section-intro">Templates, guides, tools and resources designed to help you move faster.</p>
        <div className="resource-grid">
          <div><div className="resource-art art-purple"><LayoutDashboard size={35} /></div><b>Templates</b><span>Websites & UI templates</span></div>
          <div><div className="resource-art art-green"><BookOpen size={35} /></div><b>E-books</b><span>Guides and handbooks</span></div>
          <div><div className="resource-art art-blue"><Settings2 size={35} /></div><b>Digital Tools</b><span>Tools and utilities</span></div>
          <div><div className="resource-art art-orange"><Package size={35} /></div><b>Resources</b><span>Icons, images & more</span></div>
        </div>
      </section>

      <section className="section-wrap pricing-section" id="pricing">
        <SectionHeading eyebrow="Pricing preview" title="Build the perfect package for your needs." />
        <div className="package-builder">
          <div className="package-panel product-choice">
            <small>Product</small>
            <div className="choice-row"><div className="mock-product"><BarChart3 size={25} /><b>POS System</b></div><strong>$79 <small>/mo</small></strong><span className="plus">+</span></div>
          </div>
          <div className="package-panel addon-choice">
            <small>Add-ons (Optional)</small>
            {['Loyalty Points', 'Push Notifications', 'Advanced Reports'].map((item) => (
              <label key={item}><span className="check-box"><Check size={12} /></span>{item}<b>{item === 'Loyalty Points' ? '$10' : item === 'Push Notifications' ? '$8' : '$12'} /mo</b></label>
            ))}
          </div>
          <div className="equals">=</div>
          <div className="package-total">
            <small>Total (Example)</small>
            <strong><span>From </span>$109 <small>/mo</small></strong>
            <Link to="/products" className="btn btn-dark">Build Your Package</Link>
          </div>
        </div>
      </section>

      <section className="cta-wrap section-wrap">
        <div className="cta">
          <div className="cta-icon"><Rocket size={24} /></div>
          <div><h2>Ready to build something better?</h2><p>Explore LivoTech and find the digital products, tools and solutions you need.</p></div>
          <div className="cta-actions">
            <Link to="/products" className="btn btn-white">Explore LivoTech</Link>
            <Link to="/contact" className="btn btn-ghost">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
