import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
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
    <section className="login-form-panel">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="brand-mark">PM</div>
          <div><strong>NovaTech</strong><span>Project Suite</span></div>
        </div>
        <div className="login-card-header">
          <div className="login-lock"><LockKeyhole size={22} /></div>
          <div><h1>Sign in</h1><p className="muted">Use your employee account.</p></div>
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
      </form>
    </section>
  </main>;
}
