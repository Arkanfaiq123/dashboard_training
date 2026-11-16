import { createContext, useContext, useState, useEffect } from 'react';

const AUTH_STORAGE_KEY = 'ae_admin_simple_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn('Gagal membaca sesi lokal:', e);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = (email, password) => {
    if (!email || !email.trim()) {
      throw new Error('Email wajib diisi.');
    }
    if (!password) {
      throw new Error('Password wajib diisi.');
    }

    // Login sederhana berbasis frontend untuk simulasi/dashboard internal
    const userData = {
      email: email.trim(),
      name: email.split('@')[0] || 'Administrator',
      role: 'Admin Internal',
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
