import express from "express";
import { harvestFlashcards, getDueCards, reviewCard } from "../controllers/srsController.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

router.post("/harvest", requireAuth, harvestFlashcards);
router.get("/due", requireAuth, getDueCards);
router.post("/review", requireAuth, reviewCard);

export default router;
