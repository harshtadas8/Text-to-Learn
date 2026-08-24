import { logger } from "../config/logger.js";
import { Worker } from "bullmq";
import { connection } from "../config/queue.js";
import { analyzeQuizForMemory, generateRemedialWithGemini, generateRefresherWithGemini } from "../services/ai/gemini.service.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { clearUserCache } from "../utils/cacheInvalidator.js";
import { getIo } from "../sockets/socketStore.js";

// Ensure mongoose models are loaded before processing
import "../models/Course.js";
import "../models/Progress.js";

logger.info("[Worker] Starting AI Worker...");

const aiWorker = new Worker(
  "ai-tasks",
  async (job) => {
    logger.info(`[Worker] Processing job ${job.id} of type: ${job.name}`);

    try {
      if (job.name === "memory-analysis") {
        const { userId, courseTopic, quizQuestions, userAnswers, correctCount } = job.data;
        logger.info(`[Worker] Running memory analysis for user ${userId}...`);
        
        // 1. Analyze results using our AI service
        const memoryUpdate = await analyzeQuizForMemory(courseTopic, quizQuestions, userAnswers);
        
        // 2. Fetch user
        const user = await User.findOne({ auth0Id: userId });
        if (!user) return;

        // 3. Update arrays (avoiding duplicates)
        const newStrong = memoryUpdate.newStrongTopics || [];
        const newWeak = memoryUpdate.newWeakTopics || [];
        
        const updatedStrong = new Set([...(user.strongTopics || []), ...newStrong]);
        const updatedWeak = new Set([...(user.weakTopics || []), ...newWeak]);

        user.quizHistory.push({
          date: new Date(),
          score: correctCount,
          total: quizQuestions.length
        });
        
        user.learningTime = (user.learningTime || 0) + 5; // Simulating 5 minutes per lesson
        
        // Ensure a topic isn't in both strong and weak simultaneously (strong overrides weak)
        newStrong.forEach(topic => updatedWeak.delete(topic));

        user.strongTopics = Array.from(updatedStrong);
        user.weakTopics = Array.from(updatedWeak);
        
        await user.save();
        
        // Invalidate the cache so the dashboard reflects the new XP and stats!
        await clearUserCache(userId);

        logger.info(`[Worker] Memory analysis complete. Strong: ${user.strongTopics.length}, Weak: ${user.weakTopics.length}`);
      }

      if (job.name === "remedial-lesson") {
        const { userId, courseTopic, failedQuestions } = job.data;
        logger.info(`[Worker] Generating remedial lesson for user ${userId}...`);
        
        const remedialContent = await generateRemedialWithGemini(courseTopic, failedQuestions);
        if (remedialContent) {
          logger.info(`[Worker] Remedial content generated, length: ${remedialContent.length}`);
          const user = await User.findOne({ auth0Id: userId });
          if (user) {
            if (!user.remedials) user.remedials = [];
            user.remedials.push({
              topic: courseTopic,
              content: remedialContent,
              date: new Date()
            });
            user.markModified("remedials");
            await user.save();
            await clearUserCache(userId);
            logger.info(`[Worker] Remedial lesson saved successfully for user ${userId}! Total remedials now: ${user.remedials.length}`);
            
            // Generate Notification
            const notif = await Notification.create({
              userId,
              title: "Your Content is Ready ✨",
              message: `Your personalized remedial lesson on ${courseTopic} is ready for you!`,
              type: "course_ready",
              link: "/review"
            });
            
            const io = getIo();
            if (io) {
              io.to(`user_${userId}`).emit("new_notification", notif);
            }
          } else {
            logger.info(`[Worker] Error: User not found for ID ${userId}`);
          }
        } else {
          logger.info(`[Worker] Error: Remedial content was empty!`);
        }
      }
      if (job.name === "topic-refresher") {
        const { userId, topic } = job.data;
        logger.info(`[Worker] Generating topic refresher for user ${userId} on ${topic}...`);
        
        const refresherContent = await generateRefresherWithGemini(topic);
        if (refresherContent) {
          logger.info(`[Worker] Refresher content generated, length: ${refresherContent.length}`);
          const user = await User.findOne({ auth0Id: userId });
          if (user) {
            if (!user.remedials) user.remedials = [];
            user.remedials.push({
              topic: topic + " (Refresher)",
              content: refresherContent,
              date: new Date()
            });
            user.markModified("remedials");
            await user.save();
            await clearUserCache(userId);
            logger.info(`[Worker] Refresher lesson saved successfully for user ${userId}!`);
            
            // Generate Notification
            const notif = await Notification.create({
              userId,
              title: "Your Content is Ready ✨",
              message: `Your refresher on ${topic} has finished generating. Check it out!`,
              type: "course_ready",
              link: "/review"
            });
            
            const io = getIo();
            if (io) {
              io.to(`user_${userId}`).emit("new_notification", notif);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`[Worker] Error processing job ${job.id}:`, error);
      throw error; // Let BullMQ handle retries if configured
    }
  },
  { connection }
);

aiWorker.on("completed", (job) => {
  logger.info(`[Worker] Job ${job.id} completed successfully!`);
});

aiWorker.on("failed", (job, err) => {
  logger.error(`[Worker] Job ${job.id} failed with error:`, err.message);
});

aiWorker.on("error", (err) => {
  // BullMQ might emit connection errors here. Catch them to prevent unhandled exceptions.
  logger.error(`[Worker] Connection error:`, err.message);
});

export default aiWorker;
