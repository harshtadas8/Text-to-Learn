import { logger } from "../config/logger.js";

import { cronQueue } from "../config/queue.js";

export async function setupCronJobs() {
  logger.info("[Scheduler] Setting up cron jobs...");
  
  // Remove existing repeatable jobs to avoid duplicates if schedule changes
  const repeatableJobs = await cronQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await cronQueue.removeRepeatableByKey(job.key);
  }

  // Add daily digest job (Runs every day at 8:00 AM UTC)
  await cronQueue.add("daily-digest", {}, {
    repeat: {
      pattern: "0 8 * * *"
    }
  });

  logger.info("[Scheduler] Cron jobs registered.");
}

