import mongoose from "mongoose";

const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Auth0 ID
      required: true,
      index: true,
    },
    operationType: {
      type: String,
      required: true, // e.g., 'course-generation', 'tutor-chat', 'remedial-lesson'
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    modelName: {
      type: String,
      default: "gemini-3.5-flash-lite",
    }
  },
  { timestamps: true }
);

export default mongoose.model("AIUsage", aiUsageSchema);
