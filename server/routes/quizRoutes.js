import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { generateQuizController } from "../controllers/quizController.js";

const router = express.Router();

router.post("/generate", requireAuth, generateQuizController);

export default router;
