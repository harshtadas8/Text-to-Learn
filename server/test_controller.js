import { logger } from "config/logger.js";

import mongoose from "mongoose";
import { submitQuizController } from "./controllers/quizController.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const req = {
    auth: { sub: "auth0|695e8c2cf39fb1b146c0925b" },
    body: {
      courseTopic: "Test Topic",
      quizQuestions: [1,2,3],
      userAnswers: [
        { isCorrect: true, question: "Q1", correctAnswer: "A", userAnswer: "A" },
        { isCorrect: false, question: "Q2", correctAnswer: "B", userAnswer: "C" },
        { isCorrect: false, question: "Q3", correctAnswer: "C", userAnswer: "A" }
      ]
    }
  };
  
  const res = {
    status: (code) => {
      logger.info("Status:", code);
      return res;
    },
    json: (data) => {
      logger.info("JSON:", data);
      return res;
    }
  };
  
  await submitQuizController(req, res);
  
  logger.info("Done calling controller! Waiting 5s for queue...");
  setTimeout(() => process.exit(0), 5000);
}
run();

