import { logger } from "../config/logger.js";
import { cacheConnection as redis } from "../config/queue.js";

export const courseRateLimiter = async (req, res, next) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.sub;
    if (!userId) return next();

    if (!redis) return next(); // Fallback if redis is down

    const today = new Date().toISOString().split("T")[0];
    const key = `ratelimit:courses:${userId}:${today}`;

    // Get current count
    const count = await redis.get(key);
    if (count && parseInt(count) >= 5) {
      return res.status(429).json({
        success: false,
        message: "You have reached your daily limit of 5 courses. Please try again tomorrow!"
      });
    }

    // Increment and set expiry for 24 hours
    await redis.incr(key);
    if (!count) {
      await redis.expire(key, 86400); // 24 hours
    }

    next();
  } catch (error) {
    logger.error("Course Rate Limiter Error:", error);
    next();
  }
};

export const quizRateLimiter = async (req, res, next) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.sub;
    if (!userId) return next();

    if (!redis) return next(); // Fallback if redis is down

    const today = new Date().toISOString().split("T")[0];
    const key = `ratelimit:quizzes:${userId}:${today}`;

    // Get current count
    const count = await redis.get(key);
    if (count && parseInt(count) >= 10) {
      return res.status(429).json({
        success: false,
        message: "You have reached your daily limit of 10 quizzes. Please try again tomorrow!"
      });
    }

    // Increment and set expiry for 24 hours
    await redis.incr(key);
    if (!count) {
      await redis.expire(key, 86400); // 24 hours
    }

    next();
  } catch (error) {
    logger.error("Quiz Rate Limiter Error:", error);
    next();
  }
};
