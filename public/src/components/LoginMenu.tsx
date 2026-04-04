import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/api';

import './LoginMenu.css';

/** Map API role string → frontend route */
function roleToRoute(role: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'logistician': return '/logist';
    case 'driver': return '/driver';
    case 'warehouse_manager': return '/warehouse';
    default: return '/';
  }
}

export function LoginMenu() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ── Real API ──────────────────────────────────────────────────────────
      const res = await loginApi(email, password);

      localStorage.setItem('authToken', res.token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: res.user.id,
        fullName: email.split('@')[0],  // placeholder until /me endpoint available
        email,
        phone: '',
        role: res.user.role,
      }));

      navigate(roleToRoute(res.user.role));
    } catch (apiErr) {
      setError(
        apiErr instanceof Error
          ? apiErr.message
          : 'An error occurred during login.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-menu-container">
      <div className="login-menu-glass">
        <h2 className="login-title">Log in</h2>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
