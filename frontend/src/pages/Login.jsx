import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, toast } from '../api';
import { useAuth } from '../context/AuthContext';

function PasswordField({ value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor="login-password">Password</label>
      <div className="eye-toggle">
        <input
          id="login-password"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete="current-password"
          placeholder="Your password"
        />
        <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1} aria-label="Toggle password visibility">
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    document.title = 'Login — CivicAI';
    return () => { document.title = 'CivicAI'; };
  }, []);

  async function handleSubmit(ev) {
    ev.preventDefault();
    setErr('');

    if (!email.trim()) return setErr('Email is required.');
    if (!password) return setErr('Password is required.');

    setBusy(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email: email.toLowerCase().trim(), password },
      });
      login(data.token, data.user);
      toast(`Welcome back, ${data.user.name}!`);
      // Go back to where they came from, or home
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form
      className="card narrow"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      noValidate
    >
      <h2>Sign In</h2>
      <p className="sm mu" style={{ marginBottom: 20 }}>
        Welcome back. Sign in to track and manage your civic reports.
      </p>

      <div>
        <label htmlFor="login-email">Email Address</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <PasswordField value={password} onChange={e => setPassword(e.target.value)} />

      {err && (
        <div className="warn" style={{ color: 'var(--rd)', borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}>
          {err}
        </div>
      )}

      <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
        {busy ? 'Signing in…' : '⚡ Sign In'}
      </button>

      <p className="sm mu" style={{ textAlign: 'center', marginTop: 16 }}>
        Don't have an account?{' '}
        <Link to="/signup" style={{ color: 'var(--cy)' }}>Sign up for free</Link>
      </p>

      <p className="sm mu" style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{ color: 'var(--mu)', fontSize: 12 }}>
          Admin? Use the same login — your dashboard unlocks automatically.
        </span>
      </p>
    </motion.form>
  );
}
