import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, ShieldCheck, Users, Zap } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="page-wrap section-wrap">
      <div className="page-header">
        <p className="eyebrow">About</p>
        <h1>We build digital products, tools & solutions.</h1>
        <p className="page-subtitle">LivoTech is a multi-product digital platform designed to help businesses discover, purchase, and manage the tools they need to grow.</p>
      </div>
      <div className="about-grid">
        <div className="about-card"><div className="about-icon"><Rocket size={26} /></div><h3>Our Mission</h3><p>To empower businesses with ready-to-use digital products and solutions that are easy to adopt and scale.</p></div>
        <div className="about-card"><div className="about-icon"><ShieldCheck size={26} /></div><h3>Secure by Design</h3><p>Every product is built with security in mind, from data protection to access control and beyond.</p></div>
        <div className="about-card"><div className="about-icon"><Zap size={26} /></div><h3>Built to Scale</h3><p>Our architecture supports businesses of all sizes, from solo founders to enterprise teams.</p></div>
        <div className="about-card"><div className="about-icon"><Users size={26} /></div><h3>For Every Team</h3><p>Whether you run a pharmacy, restaurant, clinic, or online store, we have solutions for you.</p></div>
      </div>
      <div className="cta-wrap">
        <div className="cta">
          <div className="cta-icon"><Rocket size={24} /></div>
          <div><h2>Want to learn more?</h2><p>Explore our products or get in touch with our team.</p></div>
          <div className="cta-actions">
            <Link to="/products" className="btn btn-white">Explore Products</Link>
            <Link to="/contact" className="btn btn-ghost">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
