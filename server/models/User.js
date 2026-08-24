import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth0Id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    picture: {
      type: String,
    },
    xp: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    strongTopics: [{
      type: String,
    }],
    weakTopics: [{
      type: String,
    }],
    lastActive: {
      type: Date,
      default: Date.now,
    },
    quizHistory: [
      {
        date: { type: Date, default: Date.now },
        score: Number,
        total: Number,
      }
    ],
    learningTime: {
      type: Number, // in minutes
      default: 0,
    },
    remedials: [
      {
        topic: String,
        content: String,
        date: { type: Date, default: Date.now }
      }
    ],
    aiUsage: {
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      estimatedCost: { type: Number, default: 0 } // in USD
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
