import express from "express";
import requireAuth from "../middlewares/requireAuth.js"; 
import { handleTutorChat } from "../controllers/tutorController.js";

const router = express.Router();

// POST /api/tutor/chat
router.post("/chat", requireAuth, handleTutorChat);

export default router;
