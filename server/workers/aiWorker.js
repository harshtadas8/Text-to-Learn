import { Worker } from "bullmq";
import { connection } from "../config/queue.js";
import { analyzeQuizForMemory, generateRemedialWithGemini } from "../services/ai/gemini.service.js";
import User from "../models/User.js";

// Ensure mongoose models are loaded before processing
import "../models/Course.js";
import "../models/Progress.js";

console.log("[Worker] Starting AI Worker...");

const aiWorker = new Worker(
  "ai-tasks",
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} of type: ${job.name}`);

    try {
      if (job.name === "memory-analysis") {
        const { userId, courseTopic, quizQuestions, userAnswers, correctCount } = job.data;
        console.log(`[Worker] Running memory analysis for user ${userId}...`);
        
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
        console.log(`[Worker] Memory analysis complete. Strong: ${user.strongTopics.length}, Weak: ${user.weakTopics.length}`);
      }

      if (job.name === "remedial-lesson") {
        const { userId, courseTopic, failedQuestions } = job.data;
        console.log(`[Worker] Generating remedial lesson for user ${userId}...`);
        
        const remedialContent = await generateRemedialWithGemini(courseTopic, failedQuestions);
        if (remedialContent) {
          console.log(`[Worker] Remedial lesson generated successfully! (Content: ${remedialContent.substring(0, 50)}...)`);
        }
      }
    } catch (error) {
      console.error(`[Worker] Error processing job ${job.id}:`, error);
      throw error; // Let BullMQ handle retries if configured
    }
  },
  { connection }
);

aiWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully!`);
});

aiWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error:`, err.message);
});

export default aiWorker;
