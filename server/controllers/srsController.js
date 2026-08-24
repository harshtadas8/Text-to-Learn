import { logger } from "../config/logger.js";
import Flashcard from "../models/Flashcard.js";

// Helper to safely get userId
const getUserId = (req) => {
  if (req.auth && req.auth.sub) return req.auth.sub;
  if (req.user && req.user.sub) return req.user.sub;
  if (req.auth && req.auth.payload && req.auth.payload.sub) return req.auth.payload.sub;
  // If no auth token worked, try query/body for debugging
  return req.query.userId || req.body.userId || null;
};

// HARVEST MCQS FROM A LESSON OR QUIZ
export async function harvestFlashcards(req, res) {
  try {
    const userId = getUserId(req);
    const { courseTopic, mcqs } = req.body;

    if (!userId || !courseTopic || !mcqs || !Array.isArray(mcqs)) {
      return res.status(400).json({ success: false, message: "Missing required fields or invalid MCQs" });
    }

    let addedCount = 0;

    for (const mcq of mcqs) {
      if (!mcq.question || !mcq.options || !mcq.correctAnswer) continue;

      // Ensure we don't save duplicates
      const exists = await Flashcard.findOne({ userId, question: mcq.question });
      
      if (!exists) {
        await Flashcard.create({
          userId,
          courseTopic,
          question: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctAnswer,
          explanation: mcq.explanation || "No explanation provided.",
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          nextReviewDate: Date.now(),
        });
        addedCount++;
      }
    }

    return res.status(200).json({ success: true, message: `Harvested ${addedCount} new flashcards.` });

  } catch (error) {
    logger.error("Harvesting error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// GET FLASHCARDS DUE FOR REVIEW
export async function getDueCards(req, res) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    // Get cards where nextReviewDate is less than or equal to now
    const now = new Date();
    const dueCards = await Flashcard.find({
      userId,
      nextReviewDate: { $lte: now }
    }).sort({ nextReviewDate: 1 }).limit(50); // limit to a manageable chunk

    return res.status(200).json({ success: true, data: dueCards });

  } catch (error) {
    logger.error("Error fetching due cards:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// SUBMIT REVIEW AND APPLY SM-2 ALGORITHM
export async function reviewCard(req, res) {
  try {
    const userId = getUserId(req);
    const { cardId, quality } = req.body; // quality is 0-5

    if (!userId || !cardId || typeof quality !== 'number' || quality < 0 || quality > 5) {
      return res.status(400).json({ success: false, message: "Invalid request payload" });
    }

    const card = await Flashcard.findOne({ _id: cardId, userId });

    if (!card) {
      return res.status(404).json({ success: false, message: "Flashcard not found" });
    }

    // SM-2 Algorithm Logic
    let { interval, repetition, efactor } = card;

    if (quality >= 3) {
      // Correct answer
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetition += 1;
    } else {
      // Incorrect answer
      repetition = 0;
      interval = 1;
    }

    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    // Update card
    card.interval = interval;
    card.repetition = repetition;
    card.efactor = efactor;
    card.nextReviewDate = nextReview;

    await card.save();

    return res.status(200).json({ success: true, data: card });

  } catch (error) {
    logger.error("Error reviewing card:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
