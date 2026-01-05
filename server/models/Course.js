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

// const courseSchema = new mongoose.Schema(
//   {
//     topic: {
//       type: String,
//       required: true,
//     },
//     level: {
//       type: String,
//       required: true,
//       enum: ["Beginner", "Intermediate", "Advanced"],
//     },
//     content: {
//       type: Object, // AI-generated structured JSON
//       required: true,
//     },
//   },
//   {
//     timestamps: true, // createdAt, updatedAt
//   }
// );

// const Course = mongoose.model("Course", courseSchema);

// export default Course;

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
    content: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
