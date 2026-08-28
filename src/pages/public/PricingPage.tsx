import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  { name: 'Starter', price: '$29', interval: '/mo', desc: 'Perfect for getting started with a single product.', features: ['1 Product', 'Basic Support', 'Standard Add-ons', 'Email Notifications'], popular: false },
  { name: 'Business', price: '$79', interval: '/mo', desc: 'For growing businesses that need more power.', features: ['Up to 5 Products', 'Priority Support', 'All Add-ons', 'Push Notifications', 'Advanced Reports'], popular: true },
  { name: 'Enterprise', price: 'Custom', interval: '', desc: 'For large teams with custom requirements.', features: ['Unlimited Products', 'Dedicated Support', 'Custom Add-ons', 'API Access', 'White-label Options'], popular: false },
];

export function PricingPage() {
  return (
    <div className="page-wrap section-wrap">
      <div className="page-header">
        <p className="eyebrow">Pricing</p>
        <h1>Build the perfect package</h1>
        <p className="page-subtitle">Choose a plan that fits your needs, or build a custom package with products and add-ons.</p>
      </div>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <div key={plan.name} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <span className="popular-tag">Most Popular</span>}
            <h3>{plan.name}</h3>
            <div className="pricing-price"><span>{plan.price}</span><small>{plan.interval}</small></div>
            <p>{plan.desc}</p>
            <ul>
              {plan.features.map((f) => <li key={f}><Check size={14} /> {f}</li>)}
            </ul>
            <Link to="/register" className={`btn ${plan.popular ? 'btn-dark' : 'btn-outline'} btn-lg w-full`}>
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
