import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Auth0 user ID
      required: true,
      index: true,
    },
    courseTopic: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    interval: {
      type: Number,
      default: 0,
    },
    repetition: {
      type: Number,
      default: 0,
    },
    efactor: {
      type: Number,
      default: 2.5,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Ensure a user doesn't get duplicate questions for the same topic
flashcardSchema.index({ userId: 1, question: 1 }, { unique: true });

export default mongoose.model("Flashcard", flashcardSchema);
