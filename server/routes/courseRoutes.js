import express from "express";
import multer from "multer";
import {
  generateCourseController,
  generateDiagnosticQuizController,
  extractTextController,
  getMyCourses,
  getPublicCourses,
  getCourseById,
  getFullCourseController,
  deleteCourseController,
} from "../controllers/courseController.js";
import requireAuth from "../middlewares/requireAuth.js";
import { sanitizePrompt } from "../middlewares/sanitize.js";
import { cacheResponse } from "../middlewares/redisCache.js";
import { courseRateLimiter } from "../middlewares/rateLimiter.js";
import { generateCertificatePDF, generateCoursePDF } from "../controllers/pdfController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course generation and management
 */

/**
 * @swagger
 * /api/courses/generate:
 *   post:
 *     summary: Generate a new AI course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               level:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course generated successfully
 */
router.post("/extract-text", requireAuth, upload.single('file'), extractTextController);
router.post("/diagnostic-quiz", requireAuth, courseRateLimiter, generateDiagnosticQuizController);
router.post("/generate", requireAuth, sanitizePrompt, courseRateLimiter, generateCourseController);
router.get("/my", requireAuth, cacheResponse(300), getMyCourses);
router.get("/public", cacheResponse(300), getPublicCourses);

// Must be below /my and /public, but above /:id/full
router.get("/:id", cacheResponse(300), getCourseById);
router.get("/:id/full", requireAuth, cacheResponse(300), getFullCourseController);
router.get("/:id/pdf", requireAuth, generateCoursePDF);
router.get("/:id/certificate", requireAuth, generateCertificatePDF);
router.delete("/:id", requireAuth, deleteCourseController);

export default router;