import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Auth0 user ID
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    completedLessons: {
      // Store an array of lesson identifiers, e.g., "1-1", "1-2" (moduleIndex-lessonIndex)
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// A user can only have one progress document per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
