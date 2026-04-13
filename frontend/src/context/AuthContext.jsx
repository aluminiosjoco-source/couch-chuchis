import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);

  // Verificar token al iniciar
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.user) setUser(data.user);
          else logout();
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    localStorage.setItem('cc_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar');
    localStorage.setItem('cc_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    setToken(null);
    setUser(null);
  };

  const authFetch = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
