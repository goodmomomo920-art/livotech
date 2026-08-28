import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /></div>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand auth-brand"><BrandMark /><span>Livo<span className="brand-accent">Tech</span></span></Link>
        <h1>Reset your password</h1>
        <p className="auth-subtitle">We'll send you a link to reset your password</p>
        {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}
        {sent ? (
          <div className="contact-success">
            <h3><Check size={20} /> Check your email</h3>
            <p>We've sent a password reset link to {email}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
            <button type="submit" className="btn btn-dark btn-lg w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={15} />
            </button>
          </form>
        )}
        <div className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
