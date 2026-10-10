import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import City3DBackground from './components/City3DBackground';
import { AuthProvider, useAuth } from './context/AuthContext';
import { toast } from './api';
import Home from './pages/Home';
import Report from './pages/Report';
import MyReports from './pages/MyReports';
import MapPage from './pages/MapPage';
import Admin from './pages/Admin';
import IssueDetail from './pages/IssueDetail';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

/* ─── Navigation bar (uses auth context) ─── */
function NavBar({ open, setOpen }) {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const baseLinks = [
    ['/', 'Home'],
    ['/report', 'Report Issue'],
    ['/my-reports', 'My Reports'],
    ['/map', 'Civic Map'],
  ];

  function handleLogout() {
    logout();
    toast('Logged out successfully.');
    navigate('/');
  }

  return (
    <nav className={open ? 'open' : ''}>
      <b>
        <span style={{ color: '#00f2fe' }}>❖</span> CivicAI
      </b>
      <button className="burger" aria-label="Menu" onClick={() => setOpen(o => !o)}>
        ☰
      </button>
      <div className="links" onClick={() => setOpen(false)}>
        {baseLinks.map(([p, t]) => (
          <NavLink key={p} to={p} end={p === '/'}>
            {t}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin">Admin Command</NavLink>
        )}
        {isLoggedIn ? (
          <>
            <span className="nav-user">
              👤 {user?.name?.split(' ')[0] || 'User'}
            </span>
            <button className="nav-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/signup" style={{ color: 'var(--cy)' }}>Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

/* ─── Root app shell ─── */
function AppShell() {
  const loc = useLocation();
  const [toasts, setToasts] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = e => {
      const id = Math.random();
      setToasts(t => [...t, { id, m: e.detail }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
    };
    window.addEventListener('toast', h);
    return () => window.removeEventListener('toast', h);
  }, []);

  return (
    <>
      <City3DBackground />
      <div className="orb o1" />
      <div className="orb o2" />
      <NavBar open={open} setOpen={setOpen} />
      <AnimatePresence mode="wait">
        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Routes location={loc}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/report" element={<Report />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/issue/:id" element={<IssueDetail />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <div id="toasts">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className="toast"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {t.m}
          </motion.div>
        ))}
      </div>
    </>
  );
}

/* ─── Root export: AuthProvider wraps everything ─── */
export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
