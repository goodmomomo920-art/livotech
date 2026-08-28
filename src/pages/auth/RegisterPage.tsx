import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /></div>;
}

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand auth-brand"><BrandMark /><span>Livo<span className="brand-accent">Tech</span></span></Link>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Start building with LivoTech today</p>
        {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Full Name<input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></label>
          <label>Confirm Password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required /></label>
          <button type="submit" className="btn btn-dark btn-lg w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'} <ArrowRight size={15} />
          </button>
        </form>
        <div className="auth-features">
          <span><Check size={13} /> 14-day money-back guarantee</span>
          <span><Check size={13} /> No setup fees</span>
          <span><Check size={13} /> Cancel anytime</span>
        </div>
        <div className="auth-footer">
          <span>Already have an account? <Link to="/login">Sign in</Link></span>
        </div>
      </div>
    </div>
  );
}
