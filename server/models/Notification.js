
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String, // Storing auth0Id
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String, // "digest", "system", "course_ready", etc.
    default: "system"
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Auto-delete after 30 days
  }
});

export default mongoose.model("Notification", notificationSchema);

