import express from "express";
import { evaluateTeachBack } from "../controllers/teachbackController.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

router.post("/evaluate", requireAuth, evaluateTeachBack);

export default router;
