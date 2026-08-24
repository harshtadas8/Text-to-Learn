import { logger } from "../config/logger.js";

import Notification from "../models/Notification.js";

export async function getNotifications(req, res) {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.sub;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (err) {
    logger.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

export async function markAsRead(req, res) {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.sub;
    const { notificationId } = req.params;

    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: "Notification not found" });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error marking notification read:", err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.sub;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    logger.error("Error marking all read:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
}

