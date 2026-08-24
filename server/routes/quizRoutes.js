import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { generateQuizController, submitQuizController } from "../controllers/quizController.js";
import { quizRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/generate", requireAuth, quizRateLimiter, generateQuizController);
router.post("/submit", requireAuth, submitQuizController);

export default router;
