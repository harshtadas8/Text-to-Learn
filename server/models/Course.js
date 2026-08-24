import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const moduleSchema = new mongoose.Schema(
  {
    moduleTitle: {
      type: String,
      required: true,
    },
    lessons: {
      type: [String],
      required: true,
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    topic: String,

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },

    language: {
      type: String,
      enum: ["English", "Hindi", "Marathi", "Hinglish"],
      default: "English",
    },

    goal: {
      type: String,
    },

    timeAvailable: {
      type: String,
    },

    content: {
      type: Object,
      required: true,
    },

    // 🔐 Auth0 User ID
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // RAG Context Chunks
    chunks: [
      {
        text: String,
        embedding: [Number], // The vector embedding
      }
    ],
  },
  { timestamps: true }
);

courseSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model("Course", courseSchema);