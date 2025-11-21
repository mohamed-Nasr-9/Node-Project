import cacheUtils from '../config/redis.js';
import { winstonLogger } from "../config/logger.js";

// Simple cache middleware for GET requests only
export const simpleCache = (expireInSeconds = 3600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Create simple cache key
      const cacheKey = `cache:${req.originalUrl}`;

      // Check cache
      const cachedData = await cacheUtils.get(cacheKey);
      if (cachedData) {
        winstonLogger.info(`Cache hit for: ${req.originalUrl}`);
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode === 200) {
          cacheUtils.set(cacheKey, data, expireInSeconds)
            .then(() => {
              winstonLogger.info(`Cached: ${req.originalUrl}`);
            })
            .catch(error => {
              winstonLogger.error(`Failed to cache: ${error}`);
            });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      winstonLogger.error(`Cache middleware error: ${error}`);
      next(); // Continue without caching
    }
  };
};

// Simple cache invalidation for write operations
export const clearCacheOnWrite = () => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to clear cache after successful write
    res.json = function(data) {
      // Clear cache for successful write operations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
        // Clear all cache (simple approach)
        cacheUtils.delPattern('cache:*')
          .then(() => {
            winstonLogger.info(`Cache cleared after ${req.method} operation`);
          })
          .catch(error => {
            winstonLogger.info(`Failed to clear cache: ${error}`);
          });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};
