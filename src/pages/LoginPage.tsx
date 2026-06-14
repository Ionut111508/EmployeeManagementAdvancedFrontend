import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, Eye, EyeOff, LockKeyhole, Network, UserRound } from 'lucide-react';
import { api } from '../api/endpoints';
import type { LoginResponse } from '../types/domain';

interface LoginPageProps {
  onLogin: (session: LoginResponse) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await api.login({ username, password });
      onLogin(session);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page">
    <section className="login-brand-panel" aria-label="Application overview">
      <div className="login-brand">
        <div className="brand-mark">PM</div>
        <div><strong>NovaTech</strong><span>Project Suite</span></div>
      </div>
      <div className="login-intro">
        <p className="eyebrow">Workforce planning</p>
        <h1>Projects, people and capacity in one operational view.</h1>
        <p>Plan work against real availability, required skills and each employee's daily norm.</p>
      </div>
      <div className="login-features">
        <div><Network size={20} /><span><strong>Resource allocation</strong><small>Manual and automatic task staffing</small></span></div>
        <div><BarChart3 size={20} /><span><strong>Capacity outlook</strong><small>Current load and future availability</small></span></div>
        <div><CheckCircle2 size={20} /><span><strong>Role-based access</strong><small>Admin, manager and employee views</small></span></div>
      </div>
    </section>

    <section className="login-form-panel">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card-header">
          <div className="login-lock"><LockKeyhole size={22} /></div>
          <div><p className="eyebrow">Secure access</p><h2>Sign in to your account</h2><p className="muted">Use the credentials assigned to your employee profile.</p></div>
        </div>

        <label className="login-field">
          <span>Username</span>
          <span className="login-input"><UserRound size={18} /><input placeholder="e.g. admin.novatech" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required autoFocus /></span>
        </label>
        <label className="login-field">
          <span>Password</span>
          <span className="login-input"><LockKeyhole size={18} /><input placeholder="Enter your password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
        </label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="btn login-submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        <p className="login-footnote">Access is limited according to your assigned role and managed projects.</p>
      </form>
    </section>
  </main>;
}
