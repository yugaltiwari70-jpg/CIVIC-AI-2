import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, img, toast } from '../api';
import { useAuth } from '../context/AuthContext';
import { MapView, Timeline, Loading, Err, Sev, Stat } from '../components';
import { STATUSES, SEVERITIES, CATEGORIES } from '../constants';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [d, setD] = useState(null);
  const [dups, setDups] = useState([]);
  const [e, setE] = useState('');

  useEffect(() => {
    document.title = id ? `${id} — CivicAI` : 'Issue — CivicAI';
    return () => { document.title = 'CivicAI'; };
  }, [id]);

  const load = useCallback(async () => {
    setE('');
    try {
      const r = await api('/issues/' + id);
      setD(r);
      document.title = `${r.issue.issueId} · ${r.issue.issueType} — CivicAI`;
      if (isAdmin) {
        try {
          setDups((await api(`/issues/${id}/duplicates`)).records);
        } catch { /* non-admin or no duplicates */ }
      }
    } catch (x) {
      setE(x.message);
    }
  }, [id, isAdmin]);

  useEffect(() => { load(); }, [load]);

  if (e) return <Err msg={e} retry={load} />;
  if (!d) return <Loading />;

  const i = d.issue;
  const next = STATUSES[STATUSES.indexOf(i.status) + 1];

  const run = async (f, ok) => {
    try { await f(); toast(ok); load(); } catch (x) { toast(x.message); }
  };

  const patch = b => run(() => api('/issues/' + i.issueId, { method: 'PATCH', body: b }), 'Updated');

  const review = (rid, confirmed) => {
    const action = confirmed ? 'Confirm grouping as related issues?' : 'Mark these as NOT related?';
    if (!window.confirm(action)) return;
    run(
      () => api('/duplicates/' + rid, { method: 'PATCH', body: { confirmed } }),
      confirmed ? 'Grouped under master issue' : 'Marked as not related'
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link to={isAdmin ? '/admin' : '/my-reports'} className="mu sm">← Back</Link>

      <h2>
        {i.issueId} · {i.issueType}
        {i.isDemoData && <span className="pill st" style={{ marginLeft: 10 }}>Demo Data</span>}
      </h2>

      {i.masterIssueId && (
        <div className="card" style={{ marginBottom: 14, borderColor: 'rgba(34, 211, 238, 0.35)' }}>
          <b>MASTER ISSUE #{i.masterIssueId}</b>{' '}
          <span className="sm mu">— admin-confirmed group · {i.supportCount} citizen report(s)</span>
        </div>
      )}

      <div className="grid c2">
        {/* Left: image + map */}
        <div className="card">
          {i.imageUrl && <img src={img(i.imageUrl)} alt="Issue evidence" style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />}
          <p>
            <Sev v={i.severity} /> <Stat v={i.status} />
          </p>
          <p className="sm">
            <b>Citizen description:</b> {i.citizenDescription || '—'}
            <br />
            <b>Location:</b> {i.locationText} ({i.latitude}, {i.longitude})
          </p>
          <MapView points={[i]} height={220} />
        </div>

        {/* Right: AI analysis + timeline + admin actions */}
        <div>
          <div className="card">
            <b>AI Analysis</b>{' '}
            <span className="sm mu">(AI Suggested)</span>
            {i.analysisMode === 'demo' && (
              <div className="warn">⚠️ Demo scenario — not a live AI result.</div>
            )}
            <p className="sm">
              Category: {i.category}<br />
              Department: {i.suggestedDepartment}<br />
              {i.explanation}<br />
              Action: {i.recommendedAction}
              {i.confidence != null && <><br />Confidence: {Math.round(i.confidence * 100)}%</>}
            </p>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <b>Timeline</b>
            <div style={{ marginTop: 8 }}>
              <Timeline issue={i} history={d.history} />
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="card" style={{ marginTop: 14 }}>
              <b>Admin Actions</b>

              <label style={{ marginTop: 12, display: 'block' }}>Override Category</label>
              <select value={i.category} onChange={e => patch({ category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>

              <label>Override Severity</label>
              <select value={i.severity} onChange={e => patch({ severity: e.target.value })}>
                {SEVERITIES.map(c => <option key={c}>{c}</option>)}
              </select>

              {next ? (
                <button
                  className="btn"
                  style={{ marginTop: 8 }}
                  onClick={() =>
                    window.confirm(`Change status to "${next}"?`) &&
                    run(() => api(`/issues/${i.issueId}/status`, { method: 'PATCH', body: { status: next } }), 'Status → ' + next)
                  }
                >
                  Mark as {next}
                </button>
              ) : (
                <div className="pill Low" style={{ marginTop: 8 }}>✓ Resolved</div>
              )}
            </div>
          )}

          {/* Duplicate management */}
          {isAdmin && dups.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <b>Possible Related Reports</b>
              {dups.map(r => (
                <div key={r._id} className="sm" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
                  <b>{r.issue?.issueId}</b> ↔ <b>{r.related?.issueId}</b> · {r.distance} m
                  <br />
                  <span className="mu">{r.similarityReason}</span>
                  <br />
                  {r.reviewed ? (
                    <span className={'pill ' + (r.confirmed ? 'Low' : 'Medium')}>
                      {r.confirmed ? '✓ Confirmed related' : '✗ Not related'}
                    </span>
                  ) : (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button className="btn s" onClick={() => review(r._id, true)}>✓ Confirm grouping</button>
                      <button className="btn s" onClick={() => review(r._id, false)}>✗ Not related</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
