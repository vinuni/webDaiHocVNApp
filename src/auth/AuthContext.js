import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from './storage';
import { setOnUnauthorized } from './sessionManager';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuth = (newToken, newUser) => {
    setTokenState(newToken);
    setUser(newUser);
  };

  const loadStoredAuth = async () => {
    try {
      const t = await authStorage.getToken();
      const u = await authStorage.getUser();
      if (t && u) {
        setTokenState(t);
        setUser(u);
      } else {
        setTokenState(null);
        setUser(null);
      }
    } catch {
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // When API returns 401, session is cleared; update state so app shows login.
  useEffect(() => {
    setOnUnauthorized(() => {
      setTokenState(null);
      setUser(null);
    });
  }, []);

  const login = async (email, password) => {
    const data = await apiClient.post('/api/v1/login', { email, password });
    const t = data.token;
    const u = data.user;
    await authStorage.setToken(t);
    await authStorage.setUser(u);
    setAuth(t, u);
    return data;
  };

  const register = async (name, email, password, password_confirmation) => {
    const data = await apiClient.post('/api/v1/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    const t = data.token;
    const u = data.user;
    await authStorage.setToken(t);
    await authStorage.setUser(u);
    setAuth(t, u);
    return data;
  };

  const socialLogin = async (provider, accessToken) => {
    const data = await apiClient.post('/api/v1/social-login', { provider, access_token: accessToken });
    const t = data.token;
    const u = data.user;
    await authStorage.setToken(t);
    await authStorage.setUser(u);
    setAuth(t, u);
    return data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/logout');
    } catch {}
    await authStorage.clear();
    setTokenState(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/api/v1/user');
      const u = res?.user ?? res;
      await authStorage.setUser(u);
      setUser(u);
      return u;
    } catch {
      return user;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        socialLogin,
        logout,
        refreshUser,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
