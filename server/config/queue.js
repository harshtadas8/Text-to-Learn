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

connection.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

connection.on("connect", () => {
  console.log("[Redis] Connected to Upstash Redis");
});

// Create queues
export const aiQueue = new Queue("ai-tasks", { connection });
