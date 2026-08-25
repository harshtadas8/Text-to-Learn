import express from "express";
import { issueCertificate, getCertificate } from "../controllers/certificateController.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

router.post("/issue/:courseId", requireAuth, issueCertificate);
router.get("/:certId", getCertificate); // PUBLIC

export default router;
