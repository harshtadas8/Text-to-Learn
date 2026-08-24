import { logger } from "config/logger.js";

import mongoose from "mongoose";
import User from "./models/User.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ auth0Id: "auth0|695e8c2cf39fb1b146c0925b" });
  logger.info("Quiz history length:", user.quizHistory.length);
  if (user.quizHistory.length > 0) {
    logger.info("Latest history:", user.quizHistory.slice(-3));
  }
  process.exit(0);
}
run();

