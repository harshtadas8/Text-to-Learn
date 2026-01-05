import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    moduleIndex: {
      type: Number,
      required: true,
    },

    lessonIndex: {
      type: Number,
      required: true,
    },

    lessonTitle: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      required: true,
      enum: ["English", "Hindi", "Marathi", "Hinglish"],
      default: "English",
    },

    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ UNIQUE PER LANGUAGE
lessonSchema.index(
  {
    courseId: 1,
    moduleIndex: 1,
    lessonIndex: 1,
    language: 1,
  },
  { unique: true }
);

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
