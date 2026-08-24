import { logger } from "config/logger.js";

import mongoose from "mongoose";
import User from "./models/User.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ auth0Id: "auth0|695e8c2cf39fb1b146c0925b" });
  logger.info("Remedials:", user.remedials.length);
  if (user.remedials.length > 0) {
    logger.info(user.remedials.map(r => r.topic));
  }
  process.exit(0);
}
run();

