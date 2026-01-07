import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import {
  generateCourseController,
  getMyCourses,
  getCourseById,
  getFullCourseController,
} from "../controllers/courseController.js";

const router = express.Router();

/**
 * 🔐 Protected routes (require Auth0 access token)
 */
router.post("/generate", requireAuth, generateCourseController);
router.get("/my", requireAuth, getMyCourses);
router.get("/:id/full", requireAuth, getFullCourseController);

/**
 * 🌍 Public route (no auth needed)
 */
router.get("/:id", getCourseById);

export default router;