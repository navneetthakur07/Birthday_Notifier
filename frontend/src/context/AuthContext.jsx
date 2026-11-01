import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('birthday_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('birthday_user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/signin', { email, password });
    const data = response.data;
    const userData = {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      roles: data.roles || [],
    };
    localStorage.setItem('birthday_token', data.token);
    localStorage.setItem('birthday_user', JSON.stringify(userData));
    setToken(data.token);
    setUser(userData);
    return userData;
  };

  const googleLogin = async (email, fullName, googleId) => {
    const response = await api.post('/api/auth/google-login', { email, fullName, googleId });
    const data = response.data;
    const userData = {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      roles: data.roles || [],
    };
    localStorage.setItem('birthday_token', data.token);
    localStorage.setItem('birthday_user', JSON.stringify(userData));
    setToken(data.token);
    setUser(userData);
    return userData;
  };

  const register = async (fullName, email, password) => {
    const response = await api.post('/api/auth/signup', { fullName, email, password });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('birthday_token');
    localStorage.removeItem('birthday_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, loading, login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
