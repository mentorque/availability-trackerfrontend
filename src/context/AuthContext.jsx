import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail");

    // If we already have fields in localStorage, initialize from there (temporary)
    if (token && role && userId) {
      setUser({ token, role, id: userId, email: email || "" });
      // Do not return here – fall through to /me to get fresh user from DB
    }

    // Fallback to existing behavior
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      // Keep localStorage email in sync with DB user
      if (u?.email) {
        localStorage.setItem("userEmail", u.email);
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const { user: u, token } = await authApi.login({ email, password });
    localStorage.setItem("token", token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const { user: u, token } = await authApi.register(data);
    localStorage.setItem("token", token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
