import axios from 'axios';

class RateLimiter {
  constructor(minDelay = 3000, maxRetries = 2) {
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.minDelay = minDelay;
    this.maxRetries = maxRetries;
  }

  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { requestFn, resolve, reject } = this.requestQueue.shift();

      try {
        const result = await this._executeWithRetry(requestFn);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Always wait between requests
      if (this.requestQueue.length > 0) {
        console.log(`Waiting ${this.minDelay}ms before next request...`);
        await new Promise((resolve) => setTimeout(resolve, this.minDelay));
      }
    }

    this.isProcessingQueue = false;
  }

  async _executeWithRetry(requestFn, retryCount = 0) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.response?.status === 429 && retryCount < this.maxRetries) {
        // Extract retry-after header if available
        const retryAfter = error.response.headers["retry-after"];
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : 5000 * Math.pow(2, retryCount);

        console.log(
          `Rate limited (429), waiting ${waitTime}ms before retry ${
            retryCount + 1
          }/${this.maxRetries}`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        return this._executeWithRetry(requestFn, retryCount + 1);
      }
      throw error;
    }
  }
}

export default RateLimiter; 