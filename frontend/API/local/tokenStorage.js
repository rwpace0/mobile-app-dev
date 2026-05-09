import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

// Keys that can hold larger, non-sensitive JSON payloads.
// These should NOT use SecureStore because it has a ~2KB size limit.
const LARGE_VALUE_KEYS = new Set(['active_workout', 'cached_user_data']);

const isLargeValueKey = (key) => LARGE_VALUE_KEYS.has(key);

export const storage = {
  async getItem(key) {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }

      // Large, non-sensitive data lives in AsyncStorage on native
      if (isLargeValueKey(key)) {
        return await AsyncStorage.getItem(key);
      }

      // Small, sensitive values (tokens, etc.) stay in SecureStore
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

      if (isLargeValueKey(key)) {
        await AsyncStorage.setItem(key, value);
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
      if (isLargeValueKey(key)) {
        await AsyncStorage.removeItem(key);
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