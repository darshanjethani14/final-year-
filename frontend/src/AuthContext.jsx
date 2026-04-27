import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "ai-ielts-auth";

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored).user;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored).token;
    } catch {
      return null;
    }
  });

  // Keep state in sync with localStorage updates
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setStudent(parsed.user);
          setToken(parsed.token);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (user, jwtToken) => {
    setStudent(user);
    setToken(jwtToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token: jwtToken }));
  };

  const logout = () => {
    setStudent(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleAuthError = (err) => {
    if (err.message?.includes("Unauthorized") || err.status === 401) {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ student, token, login, logout, handleAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
