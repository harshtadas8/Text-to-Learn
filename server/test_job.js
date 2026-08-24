import { logger } from "config/logger.js";

import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis("rediss://default:AcrJAAIjcDExNDZiYWY0ZmZlNmQ0ZGQzYjU5NGMwMmY4Y2I2ZTcwM3AxMA@relaxing-possum-44003.upstash.io:6379", { maxRetriesPerRequest: null });
const aiQueue = new Queue("ai-tasks", { connection });

async function run() {
  await aiQueue.add("remedial-lesson", {
    userId: "auth0|695e8c2cf39fb1b146c0925b",
    courseTopic: "Test Topic",
    failedQuestions: [{ question: "Q1", correctAnswer: "A", studentAnswer: "B" }]
  });
  logger.info("Job added!");
  process.exit(0);
}
run();

