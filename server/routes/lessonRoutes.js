import express from "express";
import { generateLessonController } from "../controllers/lessonController.js";

const router = express.Router();

router.post("/generate", generateLessonController);

export default router;
