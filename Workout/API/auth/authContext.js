import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from './authAPI';
import getBaseUrl from '../utils/getBaseUrl';
import { storage } from '../local/tokenStorage';

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
      const token = await storage.getItem('auth_token');
      if (!token) {
        console.log('No token found, user is not authenticated');
        setUser(null);
        setLoading(false);
        return;
      }

      let retryCount = 0;
      const maxRetries = 3;

      const attemptAuthCheck = async () => {
        try {
          const response = await fetch(`${getBaseUrl()}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.status === 429 && retryCount < maxRetries) {
            retryCount++;
            console.log(`Rate limit exceeded, retry ${retryCount}/${maxRetries} in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return attemptAuthCheck();
          }
          
          if (!response.ok) {
            console.log('Failed to fetch user data, clearing token');
            await storage.removeItem('auth_token');
            setUser(null);
            setLoading(false);
            return;
          }

          const userData = await response.json();
          
          
          // Only set user as authenticated if email is verified
          if (userData.email_confirmed_at) {
            setUser({
              ...userData,
              isAuthenticated: true
            });
          } else {
            setUser({
              ...userData,
              isAuthenticated: false
            });
          }
          setLoading(false);
        } catch (error) {
          console.error('Token validation failed:', error);
          if (error.message.includes('Too many requests') && retryCount < maxRetries) {
            retryCount++;
            console.log(`Rate limit exceeded, retry ${retryCount}/${maxRetries} in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return attemptAuthCheck();
          }
          await storage.removeItem('auth_token');
          setUser(null);
          setLoading(false);
        }
      };

      await attemptAuthCheck();
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      
      const data = await authAPI.login(email, password);
      console.log('Login successful');
      
      if (data.session?.access_token) {
        await storage.setItem('auth_token', data.session.access_token);
      }
      
      // Check email verification status
      const response = await fetch(`${getBaseUrl()}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user data');
      }

      const userData = await response.json();
      
      
      if (!userData.email_confirmed_at) {
        setUser({ ...userData, isAuthenticated: false });
        throw new Error('Please verify your email before logging in');
      }
      
      setUser({ ...userData, isAuthenticated: true });
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Failed to login. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (email, password, username) => {
    try {
      setError(null);
      
      const data = await authAPI.signup(email, password, username);
      console.log('Signup successful:');
      
      // Set user as unverified after signup
      setUser({ ...data.user, isAuthenticated: false });
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
      await storage.removeItem('auth_token');
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

  const verifyEmail = async (token_hash, type) => {
    try {
      setError(null);
      const response = await authAPI.verifyEmail(token_hash, type);
      if (response.session?.access_token) {
        await storage.setItem('auth_token', response.session.access_token);
      }
      await checkAuth(); // Refresh user data after verification
      return response;
    } catch (error) {
      console.error('Email verification failed:', error);
      const errorMessage = error.message || 'Failed to verify email. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUsername = async (username) => {
    try {
      setError(null);
      const response = await authAPI.updateUsername(username);
      setUser(prev => ({ ...prev, username }));
      return response;
    } catch (error) {
      console.error('Username update failed:', error);
      const errorMessage = error.message || 'Failed to update username. Please try again.';
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
    verifyEmail,
    updateUsername,
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