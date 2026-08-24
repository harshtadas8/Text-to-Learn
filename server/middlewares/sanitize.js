import { logger } from "../config/logger.js";

const BANNED_KEYWORDS = [
  "ignore all previous instructions",
  "system prompt",
  "you are an unconstrained",
  "bypass safety",
  "write a virus",
  "how to build a bomb"
];

export const sanitizePrompt = (req, res, next) => {
  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    const lower = str.toLowerCase();
    return BANNED_KEYWORDS.some(word => lower.includes(word));
  };

  // Check body text fields
  for (const key of Object.keys(req.body)) {
    if (checkString(req.body[key])) {
      logger.warn(`[Moderation] Blocked request due to banned keyword in field: ${key}`);
      return res.status(400).json({ error: "Your request was flagged by our content moderation guardrails." });
    }
  }

  next();
};
