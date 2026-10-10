import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api';
import { MapView, Loading, Err } from '../components';
import { SC } from '../constants';

const FILTERS = {
  All: () => true,
  'High Severity': i => ['High', 'Critical'].includes(i.severity),
  Road: i => i.category === 'Road Infrastructure',
  Waste: i => i.category === 'Waste Management',
  Water: i => i.category === 'Water & Drainage',
  Lighting: i => i.category === 'Street Lighting',
  Open: i => i.status !== 'Resolved',
  Resolved: i => i.status === 'Resolved',
};

export default function MapPage() {
  const [d, setD] = useState(null);
  const [e, setE] = useState('');
  const [f, setF] = useState('All');
  const [q, setQ] = useState('');

  useEffect(() => {
    document.title = 'Civic Map — CivicAI';
    return () => { document.title = 'CivicAI'; };
  }, []);

  const load = useCallback(() => {
    setE('');
    api('/map/issues').then(setD).catch(x => setE(x.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const pts = useMemo(
    () => (d || [])
      .filter(FILTERS[f])
      .filter(i => !q || (i.issueId + i.issueType + (i.locationText || '')).toLowerCase().includes(q.toLowerCase())),
    [d, f, q]
  );

  if (e) return <Err msg={e} retry={load} />;
  if (!d) return <Loading />;

  return (
    <>
      <h2>Civic Map</h2>
      <p className="sm mu" style={{ marginBottom: 14 }}>
        {d.length} total civic issue{d.length !== 1 ? 's' : ''} on the map. Use filters to explore.
      </p>

      <div className="chips">
        {Object.keys(FILTERS).map(k => (
          <button key={k} className={'chip' + (k === f ? ' on' : '')} onClick={() => setF(k)}>
            {k}
          </button>
        ))}
      </div>

      <input
        placeholder="Search by issue ID, type, or location…"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {pts.length ? (
        <MapView points={pts} height={520} />
      ) : (
        <div className="card empty">
          No issues match your current filters.{' '}
          {q && <button className="btn s" onClick={() => setQ('')}>Clear search</button>}
        </div>
      )}

      <p className="sm mu" style={{ marginTop: 12 }}>
        Legend:{' '}
        {Object.entries(SC).map(([k, c]) => (
          <span key={k} style={{ marginRight: 10 }}>
            <span style={{ color: c }}>●</span> {k}
          </span>
        ))}
        <span><span style={{ color: '#34d399' }}>●</span> Resolved</span>
        {' '}· <b>{pts.length}</b> issue{pts.length !== 1 ? 's' : ''} shown
      </p>
    </>
  );
}
