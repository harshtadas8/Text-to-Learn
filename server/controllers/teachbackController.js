import { logger } from "../config/logger.js";
import Lesson from "../models/Lesson.js";
import TeachBackAgent from "../services/ai/agents/TeachBackAgent.js";

export async function evaluateTeachBack(req, res) {
  try {
    const { courseId, moduleIndex, lessonIndex, language, transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Transcript cannot be empty" });
    }

    // Retrieve the source lesson
    const lesson = await Lesson.findOne({
      courseId,
      moduleIndex,
      lessonIndex,
      language: language || "English",
    });

    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found to evaluate against." });
    }

    // Reconstruct the lesson content into a single string for the AI to read
    const sourceText = lesson.content.content
      .map(block => {
        if (block.type === 'heading') return `## ${block.text}`;
        if (block.type === 'paragraph') return block.text;
        if (block.type === 'code') return `Code:\n${block.code}`;
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    const agent = new TeachBackAgent();
    
    // Fallback if RAG doesn't have enough text
    const lessonContext = `Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}: ${lesson.lessonTitle}\n\n${sourceText}`;
    
    const evaluation = await agent.evaluate(lessonContext, transcript);

    return res.json({
      success: true,
      data: evaluation,
    });

  } catch (err) {
    logger.error("Teach-Back Evaluation Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate explanation",
    });
  }
}
