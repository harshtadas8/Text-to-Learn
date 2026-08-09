import express from "express";
import { syncUser, getDashboard, markProgress, getCourseProgress, addXp } from "../controllers/userController.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

router.post("/sync", requireAuth, syncUser);
router.get("/dashboard", requireAuth, getDashboard);
router.post("/progress", requireAuth, markProgress);
router.get("/progress/:courseId", requireAuth, getCourseProgress);
router.post("/xp", requireAuth, addXp);

export default router;
