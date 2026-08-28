import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function BrandMark() {
  return <div className="brand-mark"><span /><span /><span /></div>;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
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
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your LivoTech account</p>
        {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></label>
          <button type="submit" className="btn btn-dark btn-lg w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={15} />
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>Don't have an account? <Link to="/register">Sign up</Link></span>
        </div>
      </div>
    </div>
  );
}
