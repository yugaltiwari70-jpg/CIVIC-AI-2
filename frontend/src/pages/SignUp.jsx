import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, toast } from '../api';
import { useAuth } from '../context/AuthContext';

function PasswordField({ label, value, onChange, error, id }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="eye-toggle">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={id === 'password' ? 'new-password' : 'off'}
        />
        <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1} aria-label="Toggle password visibility">
          {show ? '🙈' : '👁️'}
        </button>
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    document.title = 'Sign Up — CivicAI';
    return () => { document.title = 'CivicAI'; };
  }, []);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Please enter a valid email address.';
    }
    if (!password) {
      e.password = 'Password is required.';
    } else if (password.length < 8) {
      e.password = 'Password must be at least 8 characters.';
    }
    if (!confirm) {
      e.confirm = 'Please confirm your password.';
    } else if (password !== confirm) {
      e.confirm = 'Passwords do not match.';
    }
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerErr('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setBusy(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: { name: name.trim(), email: email.toLowerCase().trim(), password },
      });
      login(data.token, data.user);
      toast(`Welcome, ${data.user.name}! Your account has been created.`);
      navigate('/');
    } catch (err) {
      setServerErr(err.message || 'Registration failed. Please try again.');
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
      <h2>Create Account</h2>
      <p className="sm mu" style={{ marginBottom: 20 }}>
        Join CivicAI and start reporting civic issues in your city.
      </p>

      <div>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
        />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      <div>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        {errors.email && <div className="field-error">{errors.email}</div>}
      </div>

      <PasswordField
        id="password"
        label="Password (min. 8 characters)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        error={errors.password}
      />

      <PasswordField
        id="confirm"
        label="Confirm Password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        error={errors.confirm}
      />

      {serverErr && (
        <div className="warn" style={{ color: 'var(--rd)', borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}>
          {serverErr}
        </div>
      )}

      <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
        {busy ? 'Creating account…' : '🚀 Create Account'}
      </button>

      <p className="sm mu" style={{ textAlign: 'center', marginTop: 16 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--cy)' }}>Sign in</Link>
      </p>
    </motion.form>
  );
}
