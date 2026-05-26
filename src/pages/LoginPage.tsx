import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import type { LoginResponse } from '../types/domain';

interface LoginPageProps {
  onLogin: (session: LoginResponse) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await api.login({ username, password });
      localStorage.setItem('authToken', session.token);
      localStorage.setItem('authSession', JSON.stringify(session));
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page">
    <form className="login-card" onSubmit={handleSubmit}>
      <div className="brand-mark">PM</div>
      <h1>Sign in</h1>
      <p className="muted">Sign in to NovaTech Project Suite.</p>
      <input className="field" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <input className="field" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button className="btn" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      {error && <p className="status-error login-error">{error}</p>}
    </form>
  </main>;
}
