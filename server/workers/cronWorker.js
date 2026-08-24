import { logger } from "../config/logger.js";

import { Worker } from "bullmq";
import { connection } from "../config/queue.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Progress from "../models/Progress.js";
import Flashcard from "../models/Flashcard.js";

// Ensure models
import "../models/Course.js";

logger.info("[Worker] Starting Cron Worker...");

const cronWorker = new Worker(
  "cron-tasks",
  async (job) => {
    logger.info(`[Worker] Processing cron job: ${job.name}`);

    if (job.name === "daily-digest") {
      try {
        const users = await User.find({});
        logger.info(`[Worker] Generating daily digest for ${users.length} users...`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const user of users) {
          // 1. Calculate Flashcards Due
          const dueCards = await Flashcard.countDocuments({
            userId: user.auth0Id,
            nextReviewDate: { $lte: new Date() }
          });

          // 2. Determine Streak Status
          const streak = user.currentStreak || 0;
          let streakMessage = "";
          
          let lastActiveDate = null;
          if (user.lastActive) {
            lastActiveDate = new Date(user.lastActive);
            lastActiveDate.setHours(0,0,0,0);
          }
          
          const msPerDay = 1000 * 60 * 60 * 24;
          const isStreakInDanger = lastActiveDate && ((today - lastActiveDate) / msPerDay >= 1);

          if (isStreakInDanger && streak > 0) {
            streakMessage = `Your ${streak}-day streak is at risk!`;
          } else if (streak > 0) {
            streakMessage = `You are on a ${streak}-day streak! Keep it up 🔥`;
          } else {
            streakMessage = "Start your learning streak today!";
          }

          // 3. Construct Notification
          let title = "Daily Learning Digest 📚";
          let message = `${streakMessage}`;
          if (dueCards > 0) {
            message += ` You have ${dueCards} flashcards due for review.`;
          } else {
            message += ` Ready to learn something new today?`;
          }

          // Create notification (only if they dont already have one for today to prevent duplicates if job restarts)
          const startOfDay = new Date();
          startOfDay.setHours(0,0,0,0);
          
          const existing = await Notification.findOne({
            userId: user.auth0Id,
            type: "digest",
            createdAt: { $gte: startOfDay }
          });

          if (!existing) {
            await Notification.create({
              userId: user.auth0Id,
              title,
              message,
              type: "digest",
              link: "/dashboard" // Or somewhere meaningful
            });
          }
        }
        logger.info("[Worker] Daily digest job completed successfully.");
      } catch (err) {
        logger.error("[Worker] Error in daily digest:", err);
        throw err;
      }
    }
  },
  { connection }
);

cronWorker.on("failed", (job, err) => {
  logger.error(`[Worker] Cron Job ${job.id} failed:`, err.message);
});

export default cronWorker;

