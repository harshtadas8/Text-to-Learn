import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const certificateSchema = new mongoose.Schema({
  certId: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  courseTopic: {
    type: String,
    required: true
  },
  courseLevel: {
    type: String
  },
  courseLanguage: {
    type: String
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Certificate", certificateSchema);
