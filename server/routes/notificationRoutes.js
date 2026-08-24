
import { Router } from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notificationController.js";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.post("/read-all", requireAuth, markAllAsRead);
router.post("/:notificationId/read", requireAuth, markAsRead);

import { cronQueue } from "../config/queue.js";
router.post("/trigger-digest", requireAuth, async (req, res) => {
  await cronQueue.add("daily-digest", {});
  res.json({ success: true, message: "Digest job queued" });
});

export default router;

