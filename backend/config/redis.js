import { createClient } from 'redis';
import dotenv from "dotenv";
import { winstonLogger } from "./logger.js";

dotenv.config();

// Redis client configuration
const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with a individual error
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands with a individual error
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// Redis client event handlers
redisClient.on('connect', () => {
  winstonLogger.info("Redis client connected");
});

redisClient.on('ready', () => {
  winstonLogger.info("Redis client ready");
});

redisClient.on('error', (error) => {
  winstonLogger.error(`Redis client error: ${error}`);
});

redisClient.on('end', () => {
  winstonLogger.info("Redis client disconnected");
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    winstonLogger.error(`Failed to connect to Redis: ${error}`);
  }
};

// Cache utility functions
const cacheUtils = {
  // Set cache with expiration (in seconds)
  set: async (key, value, expireInSeconds = 3600) => {
    try {
      const serializedValue = JSON.stringify(value);
      if (expireInSeconds) {
        await redisClient.setEx(key, expireInSeconds, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      winstonLogger.error(`Redis SET error: ${error}`);
      return false;
    }
  },

  // Get cache
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      winstonLogger.error(`Redis GET error: ${error}`);
      return null;
    }
  },

  // Delete cache
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      winstonLogger.error(`Redis DEL error: ${error}`);
      return false;
    }
  },

  // Delete multiple keys with pattern
  delPattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      winstonLogger.error(`Redis DEL PATTERN error: ${error}`);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      winstonLogger.error(`Redis EXISTS error: ${error}`);
      return false;
    }
  },

  // Get TTL (time to live)
  ttl: async (key) => {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      winstonLogger.error(`Redis TTL error: ${error}`);
      return -1;
    }
  }
};

export { redisClient, connectRedis, cacheUtils };
export default cacheUtils;