import { logger } from "./logger.js";
import { Queue } from "bullmq";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Connect to Upstash Redis using the provided URL
// Upstash URLs typically start with rediss:// and we use maxRetriesPerRequest to comply with BullMQ rules
export const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Create a separate connection for caching so it doesn't inherit maxRetriesPerRequest: null
// This allows caching commands to fail fast and not hang the Express routes.
export const cacheConnection = new Redis(process.env.REDIS_URL, {
  commandTimeout: 5000,
  enableOfflineQueue: false, // Fail immediately if Redis is not connected
  retryStrategy: (times) => {
    // Only retry a few times before giving up, max 3 seconds delay
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
});

connection.on("error", (err) => {
  logger.error("[Redis] Connection error:", err.message);
});

connection.on("connect", () => {
  logger.info("[Redis] Connected to Upstash Redis");
});

// Create queues
export const aiQueue = new Queue("ai-tasks", { connection });
export const cronQueue = new Queue("cron-tasks", { connection });

cronQueue.on("error", (err) => {
  logger.error("[Queue] Cron Queue error:", err.message);
});

aiQueue.on("error", (err) => {
  logger.error("[Queue] Queue error:", err.message);
});
