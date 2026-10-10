import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, img } from '../api';
import { Counter, Loading, Err, Sev, Stat } from '../components';

export default function MyReports() {
  const [d, setD] = useState(null);
  const [e, setE] = useState('');

  useEffect(() => {
    document.title = 'My Reports — CivicAI';
    return () => { document.title = 'CivicAI'; };
  }, []);

  // Fetch issues belonging to this browser's anonymous reporter ID.
  // We pass anon:false so the x-reporter-id header is always sent,
  // and the backend filters issues by that reporter ID for non-admin users.
  const load = useCallback(() => {
    setE('');
    setD(null);
    api('/issues?limit=50').then(setD).catch(x => setE(x.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (e) return <Err msg={e} retry={load} />;
  if (!d) return <Loading />;

  const count = s => d.items.filter(i => s.includes(i.status)).length;

  return (
    <>
      <h2>My Reports</h2>
      <p className="sm mu" style={{ marginBottom: 20 }}>
        Reports submitted from this browser are shown here. They are linked to your anonymous device ID.
      </p>

      {/* Summary counts */}
      <div className="grid c3">
        {[
          ['Submitted', count(['Submitted'])],
          ['In Progress', count(['Under Review', 'In Progress'])],
          ['Resolved', count(['Resolved'])],
        ].map(([t, n]) => (
          <div className="card" key={t}>
            <div className="sm mu">{t}</div>
            <div className="big"><Counter to={n} /></div>
          </div>
        ))}
      </div>

      {/* Reports list */}
      <div className="grid" style={{ marginTop: 20 }}>
        {d.items.length ? d.items.map((i, k) => (
          <Link key={i._id} to={`/issue/${i.issueId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <motion.div
              className="card row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: k * 0.05 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              {i.imageUrl ? (
                <img src={img(i.imageUrl)} width="64" height="64" style={{ objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} alt="" />
              ) : (
                <span style={{ fontSize: 36, flexShrink: 0 }}>📄</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{i.issueId} · {i.issueType}</b>
                <div className="sm mu" style={{ marginTop: 4 }}>
                  {i.category} · {i.locationText || `${i.latitude.toFixed(4)}, ${i.longitude.toFixed(4)}`} · {new Date(i.createdAt).toLocaleDateString()}
                </div>
                {i.isDemoData && <span className="pill st" style={{ fontSize: 11 }}>Demo</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                <Sev v={i.severity} />
                <Stat v={i.status} />
              </div>
            </motion.div>
          </Link>
        )) : (
          <div className="card empty">
            <p>No reports yet from this device.</p>
            <Link to="/report" className="btn" style={{ marginTop: 12 }}>⚡ Report an Issue</Link>
          </div>
        )}
      </div>
    </>
  );
}
