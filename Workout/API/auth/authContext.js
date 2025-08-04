import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from './authAPI';
import getBaseUrl from '../utils/getBaseUrl';
import { storage } from '../local/tokenStorage';
import { tokenManager } from '../utils/tokenManager';

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
      // First, check if we have any tokens at all
      const { accessToken, refreshToken } = await storage.getTokens();
      
      if (!accessToken && !refreshToken) {
        console.log('No tokens found, user is not authenticated');
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if current token is expired
      const isExpired = await storage.isTokenExpired();
      
      if (isExpired && !refreshToken) {
        console.log('Token expired and no refresh token available');
        await tokenManager.clearTokens();
        setUser(null);
        setLoading(false);
        return;
      }

      // Get valid token (this will refresh if needed using local refresh token)
      const validToken = await tokenManager.getValidToken();
      if (!validToken) {
        console.log('No valid token available after refresh attempt');
        // Try to validate refresh token on server and get fresh tokens
        if (refreshToken) {
          try {
            console.log('Attempting server-side refresh token validation');
            const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.session?.access_token) {
                // Store new tokens
                await storage.setTokens(
                  data.session.access_token,
                  data.session.refresh_token,
                  data.session.expires_in
                );
                
                // Get user data with new token
                const userResponse = await fetch(`${getBaseUrl()}/auth/me`, {
                  headers: {
                    'Authorization': `Bearer ${data.session.access_token}`
                  }
                });
                
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  await storage.setItem('cached_user_data', JSON.stringify(userData));
                  
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
                  return;
                }
              }
            }
          } catch (serverError) {
            console.error('Server-side refresh validation failed:', serverError);
          }
        }
        
        // If we get here, refresh token is invalid or server validation failed
        await tokenManager.clearTokens();
        await storage.removeItem('cached_user_data');
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if we have cached user data
      const cachedUserData = await storage.getItem('cached_user_data');
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          console.log('Using cached user data - no server call needed');
          setUser({
            ...userData,
            isAuthenticated: !!userData.email_confirmed_at
          });
          setLoading(false);
          return;
        } catch (error) {
          console.log('Failed to parse cached user data, will fetch fresh data');
        }
      }

      // Only make server call if we don't have cached user data
      // This should only happen on first login or after cache is cleared
      console.log('No cached user data, making server call to get user info');
      try {
        const response = await fetch(`${getBaseUrl()}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${validToken}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          // Cache the user data permanently (until logout or token invalidation)
          await storage.setItem('cached_user_data', JSON.stringify(userData));
          
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
        } else {
          // Token is invalid on server, clear local tokens and cache
          console.log('Token invalid on server, clearing local tokens');
          await tokenManager.clearTokens();
          await storage.removeItem('cached_user_data');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        await tokenManager.clearTokens();
        await storage.removeItem('cached_user_data');
        setUser(null);
      }
      
      setLoading(false);
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
      await tokenManager.clearTokens();
      // Clear cached user data
      await storage.removeItem('cached_user_data');
      // Clear local database
      const { dbManager } = await import('../local/dbManager');
      console.log("Clearing local database");
      await dbManager.clearAllData();
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