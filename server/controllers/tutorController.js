import { logger } from "../config/logger.js";
import { chatWithLesson } from "../services/ai/gemini.service.js";
import User from "../models/User.js";

export async function handleTutorChat(req, res) {
  try {
    const { courseId, lessonContent, history, message } = req.body;

    if (!lessonContent || !message) {
      return res.status(400).json({
        success: false,
        message: "lessonContent and message are required"
      });
    }

    const chatHistory = history || [];

    const userId = req.auth?.sub;
    let user = null;
    if (userId) {
      user = await User.findOne({ auth0Id: userId });
    }

    const stream = await chatWithLesson(courseId, lessonContent, chatHistory, message, user);

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    for await (const chunk of stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    logger.error("🚨 Tutor chat error:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to get response from AI Tutor"
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Generation failed mid-stream" })}\n\n`);
      res.end();
    }
  }
}
