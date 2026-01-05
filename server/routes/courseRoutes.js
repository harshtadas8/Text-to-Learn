import express from "express";
import { getFullCourseController } from "../controllers/courseController.js";
import {
  generateCourseController,
  getAllCourses,
  getCourseById,
} from "../controllers/courseController.js";

const router = express.Router();

router.post("/generate", generateCourseController);
router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.get("/:id/full", getFullCourseController);

export default router;
