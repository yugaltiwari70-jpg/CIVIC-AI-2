import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SC, STATUSES } from './constants';

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = t => (t ? new Date(t).toLocaleString() : '');

export const Sev = ({ v }) => <span className={'pill ' + v}>{v}</span>;
export const Stat = ({ v }) => <span className="pill st">{v}</span>;

export function Counter({ to }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let s, id;
    const f = t => {
      s = s || t;
      const p = Math.min((t - s) / 900, 1);
      setN(Math.round(to * p));
      if (p < 1) id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [to]);
  return <>{n}</>;
}

export const Loading = () => (
  <div className="card empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid rgba(34, 211, 238, 0.2)',
        borderTopColor: '#00f2fe',
        animation: 'laserScan 0.8s linear infinite'
      }}
    />
    <div>Loading CivicAI Intelligence…</div>
  </div>
);

export const Err = ({ msg, retry }) => (
  <div className="card empty">
    <p>⚠️ {msg}</p>
    {retry && (
      <button className="btn" onClick={retry}>
        Retry
      </button>
    )}
  </div>
);

export function MapView({ points = [], pin, height = 340 }) {
  const el = useRef(), map = useRef(), layer = useRef();
  const pkey = points.map(p => p.issueId + p.status + p.severity + p.latitude + p.longitude).join('|');

  useEffect(() => {
    map.current = L.map(el.current).setView([20.6, 78.9], 4);
    
    // OpenStreetMap tiles — free, no API key required
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      // Subdomains not used for the main OSM tile server
    }).addTo(map.current);

    layer.current = L.layerGroup().addTo(map.current);
    const t = setTimeout(() => map.current && map.current.invalidateSize(), 300);
    return () => {
      clearTimeout(t);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!layer.current || !map.current) return;
    layer.current.clearLayers();
    const b = [];

    points.forEach(p => {
      const color = p.status === 'Resolved' ? '#34d399' : SC[p.severity] || '#22d3ee';
      L.circleMarker([p.latitude, p.longitude], {
        radius: 10,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95
      })
        .bindPopup(
          `<div style="font-family: Inter, sans-serif; color: #0f172a;">
            <b style="font-size: 14px; color: #0284c7;">${esc(p.issueId)}</b><br/>
            <b>${esc(p.issueType)}</b><br/>
            <span style="color: #64748b;">${esc(p.category)} · ${p.severity}</span><br/>
            <span style="display:inline-block; margin-top:4px; font-weight:600;">Status: ${p.status}</span><br/>
            <small>${p.supportCount} report(s)</small>
          </div>`
        )
        .addTo(layer.current);
      b.push([p.latitude, p.longitude]);
    });

    if (pin) {
      L.circleMarker([pin.lat, pin.lng], {
        radius: 12,
        color: '#00f2fe',
        weight: 3,
        fillColor: '#22d3ee',
        fillOpacity: 0.5
      })
        .bindPopup('<b style="color:#0f172a;">Selected Location</b>')
        .addTo(layer.current);
      b.push([pin.lat, pin.lng]);
    }

    if (b.length) {
      map.current.fitBounds(b, { maxZoom: 16, padding: [30, 30] });
    }
  }, [pkey, pin && pin.lat, pin && pin.lng]);

  return <div ref={el} style={{ height, borderRadius: 16, border: '1px solid var(--bd)', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }} />;
}

export function Timeline({ issue, history }) {
  const at = s => history.find(h => h.newStatus === s);
  const rows = [
    ['Report Submitted', issue.createdAt, true],
    ['AI Analysis Completed' + (issue.analysisMode === 'demo' ? ' (demo scenario)' : ''), issue.createdAt, true],
    ...STATUSES.slice(1).map(s => [s, at(s) && at(s).timestamp, !!at(s)])
  ];
  const cur = rows.findIndex(r => !r[2]);
  return (
    <div className="tl">
      {rows.map((r, i) => (
        <div key={i} className={r[2] ? 'ok' : i === cur ? 'cur' : ''}>
          {r[0]} {r[1] && <span className="sm mu">{fmt(r[1])}</span>}
        </div>
      ))}
    </div>
  );
}
