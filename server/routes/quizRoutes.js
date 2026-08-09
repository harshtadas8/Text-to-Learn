import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { generateQuizController, submitQuizController } from "../controllers/quizController.js";

const router = express.Router();

router.post("/generate", requireAuth, generateQuizController);
router.post("/submit", requireAuth, submitQuizController);

export default router;
