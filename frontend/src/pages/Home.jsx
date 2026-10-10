import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FLOW = [
  'Citizen Evidence Capture',
  'AI Vision Analysis',
  'Issue Classification',
  'Severity Matrix',
  'Smart Department Routing',
  'Duplicate Intelligence',
  'Resolution Action'
];

const DIFF = [
  ['👁️', 'AI Vision Core', 'Extracts precise civic metadata directly from uploaded images and notes.'],
  ['📊', 'Severity Intelligence', 'Ranks infrastructure urgency to fast-track critical municipal hazards.'],
  ['🧭', 'Autonomous Routing', 'Directs complaints instantly to appropriate city departments.'],
  ['🧬', 'Duplicate Detection', 'Heuristically clusters spatial reports into single master issues.'],
  ['📝', 'Structured Complaints', 'Generates actionable, editable municipal reports ready for dispatch.'],
  ['🔎', 'Real-Time Tracking', 'Complete audit trail from citizen submission to final resolution.']
];

const FUTURE = [
  'Municipal API Integration',
  'Multilingual Support',
  'Voice-to-Text Reporting',
  'WhatsApp/SMS Gateway',
  'Predictive Heatmap Analytics',
  'Geospatial Clustering Engine',
  'Push Notification Engine',
  'Public Transparency Portal'
];

export default function Home() {
  useEffect(() => {
    document.title = 'CivicAI — AI-Powered Civic Issue Reporting';
    return () => { document.title = 'CivicAI'; };
  }, []);

  return (
    <>
      <div className="hero">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="pill st" style={{ marginBottom: 12 }}>
            ✨ Next-Gen AI Civic Intelligence System
          </span>
          <h1>
            See a Problem.<br />
            <span className="g">AI Understands It.</span><br />
            Cities Fix It.
          </h1>
          <p className="mu big2" style={{ maxWidth: 520 }}>
            Transform everyday urban hazards into structured, prioritized, and trackable civic intelligence powered by multimodal AI.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <Link className="btn" to="/report">
              ⚡ Report an Issue
            </Link>
            <Link className="btn s" to="/map">
              🌐 Explore Civic Map
            </Link>
            <Link className="btn s" to="/admin">
              🛡️ Admin Command
            </Link>
          </div>
        </motion.div>

        <div className="flow">
          {FLOW.map((f, i) => (
            <motion.div
              key={f}
              className="card"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              whileHover={{ scale: 1.02, x: 4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}
            >
              <b className="g" style={{ fontSize: 18, minWidth: 24 }}>
                0{i + 1}
              </b>
              <span style={{ fontWeight: 500 }}>{f}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <h2 style={{ marginTop: 60 }}>
        We don't just log complaints. <span className="g">We drive action.</span>
      </h2>
      <div className="grid c3">
        {DIFF.map(([icon, title, desc], k) => (
          <motion.div
            key={title}
            className="card"
            whileHover={{ y: -6, scale: 1.02 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: k * 0.07, duration: 0.4 }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
            <b style={{ fontSize: 18, color: '#f8fafc' }}>{title}</b>
            <div className="mu sm" style={{ marginTop: 6 }}>
              {desc}
            </div>
          </motion.div>
        ))}
      </div>

      <h2 style={{ marginTop: 50 }}>Unified Issue Intelligence Pipeline</h2>
      <motion.div
        className="card"
        whileHover={{ scale: 1.01 }}
        style={{
          background: 'linear-gradient(135deg, rgba(13, 22, 45, 0.8) 0%, rgba(34, 211, 238, 0.08) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.25)'
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>
          Multiple Citizen Reports → CivicAI Intelligence Engine → Cluster Matching → Master Civic Record → Prioritized Municipal Action
        </div>
        <div className="mu sm">
          Spatial and semantic heuristic grouping allows municipal administrators to confirm and aggregate duplicate reports effortlessly.
        </div>
      </motion.div>

      <h2 style={{ marginTop: 50 }}>
        Future Scope Roadmap <span className="pill st">Prototype Vision</span>
      </h2>
      <div className="chips">
        {FUTURE.map(f => (
          <span key={f} className="chip">
            🚀 {f}
          </span>
        ))}
      </div>

      <p className="sm mu" style={{ marginTop: 30, textAlign: 'center' }}>
        CivicAI Hackathon Demonstration • Built with React, Three.js, Express & MongoDB Atlas.
      </p>
    </>
  );
}
