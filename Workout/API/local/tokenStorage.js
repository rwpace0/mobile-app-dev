import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  async getItem(key) {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  async removeItem(key) {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },

  // Token management methods
  async getTokens() {
    try {
      const accessToken = await this.getItem('auth_token');
      const refreshToken = await this.getItem('refresh_token');
      const tokenExpiry = await this.getItem('token_expiry');
      
      return {
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? parseInt(tokenExpiry) : null
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return { accessToken: null, refreshToken: null, tokenExpiry: null };
    }
  },

  async setTokens(accessToken, refreshToken, expiresIn = 3600) {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      await this.setItem('auth_token', accessToken);
      await this.setItem('refresh_token', refreshToken);
      await this.setItem('token_expiry', expiryTime.toString());
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  },

  async clearTokens() {
    try {
      await this.removeItem('auth_token');
      await this.removeItem('refresh_token');
      await this.removeItem('token_expiry');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  async isTokenExpired() {
    try {
      const tokenExpiry = await this.getItem('token_expiry');
      if (!tokenExpiry) return true;
      
      return Date.now() > parseInt(tokenExpiry);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }
}; 