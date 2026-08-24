import { logger } from "../config/logger.js";
import { cacheConnection as redisClient } from "../config/queue.js";

/**
 * Middleware to cache API responses in Redis.
 * @param {number} durationInSeconds - How long the cache should live (e.g. 300 for 5 mins)
 */
export const cacheResponse = (durationInSeconds = 300) => {
  return async (req, res, next) => {
    try {
      // Create a unique key for the request.
      // If the user is authenticated, append their userId to the key so caches don't bleed across users.
      // Otherwise, just use the URL.
      const userId = req.auth?.sub || "public";
      const key = `cache:${userId}:${req.originalUrl}`;

      // Check if data exists in Redis
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        logger.info(`[Redis] Cache HIT for ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      logger.info(`[Redis] Cache MISS for ${key}`);

      // Override res.json to capture the response data before it gets sent
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success !== false) {
          redisClient.setex(key, durationInSeconds, JSON.stringify(body))
            .catch(err => logger.error("[Redis] Cache Set Error:", err));
        }
        
        // Send the actual response
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error("[Redis] Cache Middleware Error:", error);
      // If Redis fails, gracefully fall back to executing the route normally
      next();
    }
  };
};
