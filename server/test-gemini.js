import { logger } from "config/logger.js";

import "dotenv/config";
import { generateDiagnosticQuizWithGemini, generateCourseWithGemini } from "./services/ai/gemini.service.js";

async function test() {
  try {
    const topic = "Testing";
    const language = "English";
    const source = "hello ".repeat(5000); // 30k chars

    logger.info("Generating Quiz...");
    const quiz = await generateDiagnosticQuizWithGemini(topic, language, source);
    logger.info("Quiz done.", quiz.questions.length);

    logger.info("Generating Course...");
    const course = await generateCourseWithGemini(topic, "Beginner", language, "Goal", "2-5 hours/week", null, source);
    logger.info("Course done.", course.courseTitle);

  } catch(e) {
    logger.error("Crash:", e);
  }
}
test();

