import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-wrap section-wrap">
      <div className="page-header">
        <p className="eyebrow">Contact</p>
        <h1>Get in touch</h1>
        <p className="page-subtitle">Have a question or need help? We're here to help you find the right solution.</p>
      </div>
      <div className="contact-grid">
        <div className="contact-info">
          <div className="contact-item"><Mail size={18} /><div><b>Email</b><p>contact@livotech.com</p></div></div>
          <div className="contact-item"><Phone size={18} /><div><b>Phone</b><p>+1 (555) 000-0000</p></div></div>
          <div className="contact-item"><MapPin size={18} /><div><b>Address</b><p>Remote-first, serving clients worldwide</p></div></div>
        </div>
        <div className="contact-form-wrap">
          {submitted ? (
            <div className="contact-success">
              <h3>Message sent!</h3>
              <p>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              <textarea placeholder="Your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} required />
              <button type="submit" className="btn btn-dark btn-lg w-full">Send Message <Send size={15} /></button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
