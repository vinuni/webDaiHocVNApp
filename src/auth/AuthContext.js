import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from './storage';
import { setOnUnauthorized } from './sessionManager';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnTo, setReturnTo] = useState(null); // Store screen to return to after login

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
        // No valid token - try auto-login with saved credentials
        const credentials = await authStorage.getCredentials();
        if (credentials && credentials.email && credentials.password) {
          try {
            if (__DEV__) {
              console.log('[AuthContext] Auto-login with saved credentials');
            }
            const data = await apiClient.post('/api/v1/login', {
              email: credentials.email,
              password: credentials.password,
            });
            const newToken = data.token;
            const newUser = data.user;
            await authStorage.setToken(newToken);
            await authStorage.setUser(newUser);
            setTokenState(newToken);
            setUser(newUser);
          } catch (err) {
            if (__DEV__) {
              console.log('[AuthContext] Auto-login failed:', err.message);
            }
            // Auto-login failed - credentials might be invalid, clear them
            await authStorage.clearCredentials();
            setTokenState(null);
            setUser(null);
          }
        } else {
          setTokenState(null);
          setUser(null);
        }
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

  const login = async (email, password, rememberMe = true) => {
    const payload = { email, password };
    if (__DEV__) {
      console.log('[AuthContext] login payload:', payload);
    }
    const data = await apiClient.post('/api/v1/login', payload);
    const t = data.token;
    const u = data.user;
    await authStorage.setToken(t);
    await authStorage.setUser(u);
    // Ensure token is readable from storage before continuing (avoids race on web)
    const stored = await authStorage.getToken();
    if (!stored && __DEV__) {
      console.warn('[AuthContext] Token may not be persisted yet');
    }

    // Save credentials for auto-login if rememberMe is true
    if (rememberMe) {
      await authStorage.setCredentials(email, password);
    } else {
      await authStorage.clearCredentials();
    }

    setAuth(t, u);
    
    // Clear returnTo after successful login
    const previousReturnTo = returnTo;
    setReturnTo(null);
    
    return { ...data, returnTo: previousReturnTo };
  };

  const register = async (name, email, password, password_confirmation) => {
    const payload = {
      name,
      email,
      password,
      password_confirmation,
    };
    if (__DEV__) {
      console.log('[AuthContext] register payload:', payload);
    }
    const data = await apiClient.post('/api/v1/register', payload);
    const t = data.token;
    const u = data.user;
    await authStorage.setToken(t);
    await authStorage.setUser(u);
    setAuth(t, u);
    return data;
  };

  const   socialLogin = async (provider, accessToken, idToken = null) => {
    const body = { provider };
    if (accessToken) body.access_token = accessToken;
    if (idToken) body.id_token = idToken;
    const data = await apiClient.post('/api/v1/social-login', body);
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
        returnTo,
        setReturnTo,
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
