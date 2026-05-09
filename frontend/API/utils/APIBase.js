import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { storage } from '../local/tokenStorage';
import { tokenManager } from './tokenManager';
import RateLimiter from './RateLimiter';
import LocalStorageManager from './LocalStorageManager';
import Cache from './Cache';

class APIBase {
  constructor(baseUrl, db, options = {}) {
    this.baseUrl = baseUrl;
    this.db = db;
    this.rateLimiter = new RateLimiter(options.minDelay, options.maxRetries);
    this.storage = new LocalStorageManager(db);
    this.cache = new Cache(options.cacheConfig);
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async ensureInitialized() {
    if (this.isInitialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = this._initialize();
    }

    await this.initializationPromise;
  }

  async _initialize() {
    try {
      // Wait for database to be ready
      await this.db.initializationPromise;
      
      // Check if we have any entities in local db
      const [localCount] = await this.db.query(
        `SELECT COUNT(*) as count FROM ${this.getTableName()}`
      );

      if (localCount.count === 0) {
        await this._fetchInitialData();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error(`${this.constructor.name} initialization error:`, error);
      this.isInitialized = true; // Set to true even on error to prevent repeated attempts
    }
  }

  async _fetchInitialData() {
    const netInfo = await NetInfo.fetch();
    const token = await storage.getItem("auth_token");

    if (netInfo.isConnected && token) {
      try {
        const response = await this.rateLimiter.queueRequest(async () => {
          return await axios.get(this.baseUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
        });

        for (const entity of response.data) {
          await this.storeLocally(entity);
        }
      } catch (error) {
        console.error(`Failed to fetch initial ${this.constructor.name} data:`, error);
      }
    }
  }

  async makeAuthenticatedRequest(config) {
    const accessToken = await tokenManager.getValidToken();
    if (!accessToken) throw new Error("No auth token found");

    // Add detailed logging for debugging
   // console.log(`[APIBase] Making ${config.method} request to: ${config.url}`);
   // console.log(`[APIBase] Request config:`, {
   //   method: config.method,
   //   url: config.url,
   //   data: config.data,
   //   headers: config.headers
   // });

    return this.rateLimiter.queueRequest(async () => {
      try {
        const response = await axios({
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        //console.log(`[APIBase] ${config.method} ${config.url} - SUCCESS (${response.status})`);
        //console.log(`[APIBase] Response data:`, response.data);
        return response;
      } catch (error) {
        console.error(`[APIBase] ${config.method} ${config.url} - FAILED`);
        console.error(`[APIBase] Error status:`, error.response?.status);
        console.error(`[APIBase] Error data:`, error.response?.data);
        console.error(`[APIBase] Error config:`, error.config);
        console.error(`[APIBase] Full error:`, error);
        throw error;
      }
    });
  }

  async handleOfflineFirst(cacheKey, fetchFn) {
    // Try cache first
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    // Then try local DB
    const localData = await fetchFn();
    if (localData) {
      this.cache.set(cacheKey, localData);
      return localData;
    }

    // Finally try server if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const serverData = await this._fetchFromServer();
        // Don't call storeLocally here since _fetchFromServer already stores individual entities
        this.cache.set(cacheKey, serverData);
        return serverData;
      } catch (error) {
        console.error(`Server fetch failed for ${this.constructor.name}:`, error);
        return localData || null;
      }
    }

    return null;
  }

  // Methods to be implemented by child classes
  getTableName() {
    throw new Error('getTableName must be implemented by child class');
  }

  async storeLocally(entity, syncStatus = "synced") {
    throw new Error('storeLocally must be implemented by child class');
  }

  async _fetchFromServer() {
    throw new Error('_fetchFromServer must be implemented by child class');
  }
}

export default APIBase; 