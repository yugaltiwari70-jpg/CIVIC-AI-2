import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/** Safely decode the JWT payload without an external library. */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    // Base64url → base64 → JSON
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Read persisted auth state from localStorage, clearing if token is expired. */
function readPersisted() {
  const raw = localStorage.getItem('civicai_token');
  if (!raw) return { token: null, user: null };
  const decoded = decodeToken(raw);
  if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
    localStorage.removeItem('civicai_token');
    localStorage.removeItem('civicai_user');
    return { token: null, user: null };
  }
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('civicai_user')); } catch { return null; }
  })();
  return { token: raw, user };
}

export function AuthProvider({ children }) {
  const persisted = readPersisted();
  const [authToken, setAuthToken] = useState(persisted.token);
  const [user, setUser] = useState(persisted.user);

  const login = useCallback((token, userData) => {
    localStorage.setItem('civicai_token', token);
    localStorage.setItem('civicai_user', JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('civicai_token');
    localStorage.removeItem('civicai_user');
    setAuthToken(null);
    setUser(null);
  }, []);

  const isLoggedIn = !!authToken && !!user;
  const isAdmin = isLoggedIn && user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, authToken, isLoggedIn, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
