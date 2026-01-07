import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import {
  generateCourseController,
  getMyCourses,
  getCourseById,
  getFullCourseController,
} from "../controllers/courseController.js";

const router = express.Router();

router.post("/generate", requireAuth, generateCourseController);
router.get("/my", requireAuth, getMyCourses);
router.get("/:id", getCourseById);
router.get("/:id/full", requireAuth, getFullCourseController);

export default router;
