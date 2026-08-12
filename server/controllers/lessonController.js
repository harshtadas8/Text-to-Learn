import Lesson from "../models/Lesson.js";
import Course from "../models/Course.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJson } from "../utils/jsonUtils.js";
import { generateEmbeddings } from "../services/ai/gemini.service.js";

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

    const prompt = LESSON_DETAIL_PROMPT(
      courseTitle,
      moduleTitle,
      lessonTitle,
      language
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
        console.log(`[RAG] Generating embeddings for lesson ${lessonTitle}`);
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
          console.log(`[RAG] Added ${chunks.length} chunks for course ${courseId}`);
        }
      } catch (embErr) {
        console.error("[RAG] Failed to generate embeddings:", embErr);
      }
    })();

    return res.json({
      success: true,
      data: lessonData,
      cached: false,
    });

  } catch (err) {
    console.error("❌ Lesson generation error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lesson generation failed",
    });
  }
}
