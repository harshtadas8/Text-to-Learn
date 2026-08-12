import mongoose from "mongoose";

const courseChunkSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  text: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // 768 dimensions for Gemini
    required: true,
  },
});

export default mongoose.model("CourseChunk", courseChunkSchema);
