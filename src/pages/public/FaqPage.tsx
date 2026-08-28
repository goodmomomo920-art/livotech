import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'What is LivoTech?', a: 'LivoTech is a multi-product digital platform that offers ready-made websites, business systems, SaaS products, add-ons, digital products, and e-books — all in one place.' },
  { q: 'How do I get started?', a: 'Simply create an account, browse our product catalog, and choose the product and plan that fits your needs. You can add compatible add-ons at any time.' },
  { q: 'Can I own multiple products?', a: 'Yes! A single LivoTech account can hold multiple products — websites, POS systems, inventory systems, e-books, and more — all managed from one dashboard.' },
  { q: 'Are the products customizable?', a: 'Yes, all our websites and systems are fully customizable. You can change colors, fonts, layout, and content to match your brand.' },
  { q: 'What payment methods do you accept?', a: 'We are preparing integration with multiple payment providers. Payment options will be available once the payment system is fully activated.' },
  { q: 'Is there a money-back guarantee?', a: 'Yes, we offer a 14-day money-back guarantee on most products. If you are not satisfied, contact support for a full refund.' },
  { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel your subscription at any time from your dashboard. Your product will remain active until the end of your billing period.' },
  { q: 'Do you offer support?', a: 'Yes, all plans include support. You can create a support ticket from your dashboard and our team will respond promptly.' },
];

export function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="page-wrap section-wrap">
      <div className="page-header">
        <p className="eyebrow">FAQ</p>
        <h1>Frequently asked questions</h1>
        <p className="page-subtitle">Find answers to common questions about LivoTech products, subscriptions, and more.</p>
      </div>
      <div className="faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className="faq-item">
            <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
              {faq.q}
              <ChevronDown size={16} className={open === i ? 'rotate-180' : ''} />
            </button>
            {open === i && <div className="faq-answer">{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
