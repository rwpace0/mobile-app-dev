import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from './auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // check if user is authenticated on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await authAPI.isAuthenticated();
      if (token) {
        // If we have a token, try to validate it by making a request
        try {
          // You can make a request to your backend to validate the token
          // For now, we'll just set the user as authenticated
          setUser({ isAuthenticated: true });
        } catch (error) {
          console.error('Token validation failed:', error);
          // If token validation fails, clear the token
          await authAPI.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      console.log('Attempting login for:', email);
      const data = await authAPI.login(email, password);
      console.log('Login successful:', data);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Failed to login. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (email, password) => {
    try {
      setError(null);
      console.log('Attempting signup for:', email);
      const data = await authAPI.signup(email, password);
      console.log('Signup successful:', data);
      return data;
    } catch (error) {
      console.error('Signup failed:', error);
      const errorMessage = error.message || 'Failed to sign up. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      const errorMessage = error.message || 'Failed to logout. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      return await authAPI.resetPassword(email);
    } catch (error) {
      console.error('Password reset failed:', error);
      const errorMessage = error.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 