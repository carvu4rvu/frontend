import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext();

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token on load and validate it
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Token expired, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } else {
        // Token is valid, set user
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: "No token received" };
    } catch (error) {
      return { success: false, message: error.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Verify token is still valid
  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      logout();
      return false;
    }
    return true;
  };

  const isAuthenticated = !!user && !isTokenExpired(localStorage.getItem('token'));

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
