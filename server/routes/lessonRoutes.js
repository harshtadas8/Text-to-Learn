import express from "express";
import { generateLessonController } from "../controllers/lessonController.js";

const router = express.Router();

import { requireAuth } from "../middlewares/auth.js";

router.post("/generate", requireAuth, generateLessonController);


export default router;
