import express from "express";
import {
  generateCourseController,
  getMyCourses,
  getPublicCourses,
  getCourseById,
  getFullCourseController,
} from "../controllers/courseController.js";
import requireAuth from "../middlewares/requireAuth.js";
import { cacheResponse } from "../middlewares/redisCache.js";

const router = express.Router();

router.post("/generate", requireAuth, generateCourseController);
router.get("/my", requireAuth, getMyCourses);
router.get("/public", cacheResponse(300), getPublicCourses);

// Must be below /my and /public, but above /:id/full
router.get("/:id", getCourseById);
router.get("/:id/full", requireAuth, cacheResponse(300), getFullCourseController);

export default router;