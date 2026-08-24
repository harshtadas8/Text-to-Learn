import { logger } from "../config/logger.js";
import Lesson from "../models/Lesson.js";
import Course from "../models/Course.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJson } from "../utils/jsonUtils.js";
import { generateEmbeddings } from "../services/ai/gemini.service.js";

import User from "../models/User.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

import { LESSON_DETAIL_PROMPT } from "../config/prompts.js";

export async function generateLessonController(req, res) {
  try {
    const {
      courseId,
      courseTitle,
      moduleIndex,
      moduleTitle,
      lessonIndex,
      lessonTitle,
      language = "English",
    } = req.body;

    // 🔍 CACHE CHECK (language-aware)
    const cached = await Lesson.findOne({
      courseId,
      moduleIndex,
      lessonIndex,
      language,
    });

    if (cached) {
      return res.json({
        success: true,
        data: cached.content,
        cached: true,
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    // Extract User Memory
    const userId = req.auth?.sub;
    let memoryConstraint = "";
    if (userId) {
      const user = await User.findOne({ auth0Id: userId });
      if (user && (user.weakTopics?.length > 0 || user.strongTopics?.length > 0)) {
        memoryConstraint = `
USER ADAPTIVE PROFILE (Cross-Course Context):
- The user is STRONG at: ${user.strongTopics?.join(', ') || 'N/A'} (Skip the absolute basics for these topics if they appear).
- The user is WEAK at: ${user.weakTopics?.join(', ') || 'N/A'} (Explain these topics in much simpler terms if they appear, providing more analogies and simple examples).
Make sure to adapt the lesson content to match this profile!
`;
      }
    }

    const prompt = LESSON_DETAIL_PROMPT(
      courseTitle,
      moduleTitle,
      lessonTitle,
      language,
      memoryConstraint
    );

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const lessonData = extractJson(rawText);

    // 💾 SAVE WITH LANGUAGE
    await Lesson.create({
      courseId,
      moduleIndex,
      lessonIndex,
      lessonTitle,
      language,
      content: lessonData,
    });

    // --- BACKGROUND EMBEDDING FOR RAG ---
    (async () => {
      try {
        logger.info(`[RAG] Generating embeddings for lesson ${lessonTitle}`);
        const chunks = [];
        // Chunking by blocks
        for (const block of lessonData.content) {
          if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'code') {
            const textToEmbed = block.text || block.code;
            if (textToEmbed && textToEmbed.trim().length > 10) {
               const chunkText = `[${moduleTitle} - ${lessonTitle}]: ${textToEmbed}`;
               const embedding = await generateEmbeddings(chunkText);
               chunks.push({ text: chunkText, embedding });
            }
          }
        }
        
        if (chunks.length > 0) {
          const CourseChunk = (await import("../models/CourseChunk.js")).default;
          
          // Map chunks to include courseId
          const chunkDocs = chunks.map(c => ({
            courseId,
            text: c.text,
            embedding: c.embedding
          }));
          
          await CourseChunk.insertMany(chunkDocs);
          logger.info(`[RAG] Added ${chunks.length} chunks for course ${courseId}`);
        }
      } catch (embErr) {
        logger.error("[RAG] Failed to generate embeddings:", embErr);
      }
    })();

    return res.json({
      success: true,
      data: lessonData,
      cached: false,
    });

  } catch (err) {
    logger.error("❌ Lesson generation error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lesson generation failed",
    });
  }
}
