import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, toast } from '../api';
import { useAuth } from '../context/AuthContext';
import { Counter, Loading, Err, Sev, Stat } from '../components';
import { STATUSES, SEVERITIES, CATEGORIES } from '../constants';

/* ─── Login form (shown when not authenticated as admin) ─── */
function Login({ onSuccess }) {
  const [em, setEm] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();

  const go = async ev => {
    ev.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api('/auth/login', { method: 'POST', body: { email: em, password: pw } });
      if (r.user.role !== 'admin') {
        setErr('This account does not have admin privileges.');
        return;
      }
      login(r.token, r.user);
      toast('Welcome, ' + r.user.name);
      onSuccess();
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      className="card narrow"
      onSubmit={go}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2>Admin Login</h2>
      <p className="sm mu" style={{ marginBottom: 20 }}>
        Enter your administrator credentials to access the Command Center.
      </p>
      <label>Email</label>
      <input type="email" value={em} onChange={e => setEm(e.target.value)} required autoComplete="email" />
      <label>Password</label>
      <div className="eye-toggle">
        <input
          type={showPw ? 'text' : 'password'}
          value={pw}
          onChange={e => setPw(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1} aria-label="Toggle password">
          {showPw ? '🙈' : '👁️'}
        </button>
      </div>
      {err && (
        <div className="warn" style={{ color: 'var(--rd)', borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' }}>
          {err}
        </div>
      )}
      <button className="btn" disabled={busy} style={{ width: '100%' }}>
        {busy ? 'Signing in…' : '⚡ Sign in as Admin'}
      </button>
      <div className="sm mu" style={{ marginTop: 8, textAlign: 'center' }}>
        Credentials are set via the backend <code>.env</code> file.
      </div>
    </motion.form>
  );
}

/* ─── Analytics bar chart ─── */
const Bars = ({ title, keys, data, total }) => (
  <div className="card">
    <b>{title}</b>
    {keys.map(k => (
      <div key={k} className="sm" style={{ margin: '8px 0' }}>
        {k} <span className="mu">({data[k] || 0})</span>
        <div className="bar">
          <i style={{ '--w': (total ? (data[k] || 0) / total * 100 : 0) + '%' }} />
        </div>
      </div>
    ))}
  </div>
);

/* ─── Main dashboard (admin only) ─── */
function Dash({ onLogout }) {
  const [a, setA] = useState(null);
  const [l, setL] = useState(null);
  const [e, setE] = useState('');
  const [f, setF] = useState({ search: '', severity: '', status: '', category: '', sort: '-createdAt', page: 1 });

  const loadA = useCallback(() =>
    api('/analytics').then(setA).catch(x => {
      setE(x.message);
      if (x.status === 401) onLogout();
    }), [onLogout]);

  useEffect(() => { loadA(); }, [loadA]);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({
        limit: 8,
        ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))
      });
      api('/issues?' + p).then(setL).catch(x => setE(x.message));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  const set = (k, v) => setF(o => ({ ...o, [k]: v, page: k === 'page' ? v : 1 }));

  if (e) return <Err msg={e} retry={() => { setE(''); loadA(); }} />;
  if (!a || !l) return <Loading />;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>CivicAI <span className="g">Command Center</span></h2>
        <button className="nav-logout" onClick={onLogout}>Logout</button>
      </div>

      <div className="sm mu" style={{ marginBottom: 12 }}>All figures are computed from live database records.</div>

      {/* KPI cards */}
      <div className="grid c4">
        {[['Total Issues', a.total], ['Open', a.open], ['High/Critical Open', a.highOrCriticalOpen], ['Resolved', a.resolved]].map(([t, n]) => (
          <div className="card" key={t}>
            <div className="sm mu">{t}</div>
            <div className="big"><Counter to={n} /></div>
          </div>
        ))}
      </div>

      {/* Category/Severity/Status breakdown */}
      {a.total === 0 ? (
        <div className="card empty" style={{ marginTop: 16 }}>No reports yet. Use the seed script to add demo data.</div>
      ) : (
        <div className="grid c3" style={{ marginTop: 16 }}>
          <Bars title="By Category" keys={CATEGORIES.filter(c => a.byCategory[c])} data={a.byCategory} total={a.total} />
          <Bars title="By Severity" keys={SEVERITIES} data={a.bySeverity} total={a.total} />
          <Bars title="By Status" keys={STATUSES} data={a.byStatus} total={a.total} />
        </div>
      )}

      {/* 30-day trend */}
      <div className="card" style={{ marginTop: 16 }}>
        <b>Issues over last 30 days</b>
        <div className="trend">
          {a.trend.length ? a.trend.map(t => (
            <div key={t.date} title={`${t.date}: ${t.count} report(s)`} style={{ height: 14 + t.count * 18 }} />
          )) : <span className="mu sm">No reports in the last 30 days</span>}
        </div>
      </div>

      {/* Issues table with filters */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="grid c5">
          <input placeholder="Search ID, type, or location…" value={f.search} onChange={e => set('search', e.target.value)} />
          <select value={f.severity} onChange={e => set('severity', e.target.value)}>
            <option value="">Severity</option>
            {SEVERITIES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={f.category} onChange={e => set('category', e.target.value)}>
            <option value="">Category</option>
            {CATEGORIES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={f.status} onChange={e => set('status', e.target.value)}>
            <option value="">Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={f.sort} onChange={e => set('sort', e.target.value)}>
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-supportCount">Most reports</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {l.items.length ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Issue</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Department</th>
                  <th>Reports</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {l.items.map(i => (
                  <tr key={i._id}>
                    <td>{i.issueId}</td>
                    <td>{i.issueType}</td>
                    <td>{i.category}</td>
                    <td><Sev v={i.severity} /></td>
                    <td>{i.suggestedDepartment}</td>
                    <td>{i.supportCount}</td>
                    <td><Stat v={i.status} /></td>
                    <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                    <td><Link className="btn s" to={`/issue/${i.issueId}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No reports match your filters.</div>
          )}
        </div>

        {/* Pagination */}
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn s" disabled={l.page <= 1} onClick={() => set('page', l.page - 1)}>‹</button>
          <span className="sm">Page {l.page} of {l.pages}</span>
          <button className="btn s" disabled={l.page >= l.pages} onClick={() => set('page', l.page + 1)}>›</button>
        </div>
      </div>
    </>
  );
}

/* ─── Admin page root ─── */
export default function Admin() {
  const { isAdmin, logout } = useAuth();
  const [forceShow, setForceShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admin — CivicAI';
    return () => { document.title = 'CivicAI'; };
  }, []);

  function handleLogout() {
    logout();
    toast('Logged out successfully.');
    navigate('/');
  }

  // Show dashboard if the global auth context says they are admin
  // OR if they just logged in through the local login form (forceShow)
  const showDash = isAdmin || forceShow;

  if (showDash) {
    return <Dash onLogout={handleLogout} />;
  }

  return <Login onSuccess={() => setForceShow(true)} />;
}
