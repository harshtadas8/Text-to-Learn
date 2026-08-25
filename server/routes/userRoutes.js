import express from "express";
import { syncUser, getDashboard, markProgress, getCourseProgress, addXp, generateRefresher, enrollCourse } from "../controllers/userController.js";
import requireAuth from "../middlewares/requireAuth.js";
import { cacheResponse } from "../middlewares/redisCache.js";

const router = express.Router();

router.post("/sync", requireAuth, syncUser);
router.get("/dashboard", requireAuth, cacheResponse(300), getDashboard);
router.post("/progress", requireAuth, markProgress);
router.post("/enroll/:courseId", requireAuth, enrollCourse);
router.get("/progress/:courseId", requireAuth, getCourseProgress);
router.post("/xp", requireAuth, addXp);
router.post("/generate-refresher", requireAuth, generateRefresher);

export default router;
