import { storage } from '../local/tokenStorage';
import axios from 'axios';
import getBaseUrl from "./getBaseUrl";

class TokenManager {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  async getValidToken() {
    try {
      const { accessToken, refreshToken } = await storage.getTokens();
      
      if (!accessToken && !refreshToken) {
        return null;
      }

      // Check if current token is expired
      const isExpired = await storage.isTokenExpired();
      
      if (isExpired && refreshToken) {
        // Token is expired, try to refresh
        return await this.refreshAccessToken(refreshToken);
      }
      
      return accessToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  async refreshAccessToken(refreshToken) {
    if (this.isRefreshing) {
      // If already refreshing, wait for the current refresh to complete
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      // Make the refresh request directly here instead of using authAPI
      const response = await axios.post(`${getBaseUrl()}/auth/refresh`, {
        refresh_token: refreshToken
      });
      
      const responseData = response.data;
      
      if (responseData.session?.access_token) {
        await storage.setTokens(
          responseData.session.access_token,
          responseData.session.refresh_token,
          responseData.session.expires_in
        );
        
        // Process queued requests
        this.failedQueue.forEach(({ resolve }) => {
          resolve(responseData.session.access_token);
        });
        this.failedQueue = [];
        
        this.isRefreshing = false;
        return responseData.session.access_token;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Process queued requests with error
      this.failedQueue.forEach(({ reject }) => {
        reject(error);
      });
      this.failedQueue = [];
      
      // Clear tokens if refresh fails
      await storage.clearTokens();
      this.isRefreshing = false;
      throw error;
    }
  }

  async clearTokens() {
    await storage.clearTokens();
  }

  async isAuthenticated() {
    try {
      const token = await this.getValidToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export const tokenManager = new TokenManager(); 