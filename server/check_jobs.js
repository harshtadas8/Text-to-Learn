import { logger } from "config/logger.js";

import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const aiQueue = new Queue("ai-tasks", { connection });

async function run() {
  const completed = await aiQueue.getCompleted();
  logger.info("Completed:", completed.length, completed.map(j => j.id));
  process.exit(0);
}
run();

