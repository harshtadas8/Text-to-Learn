import { logger } from "../../../config/logger.js";
import { BaseAgent } from "./BaseAgent.js";
import Course from "../../../models/Course.js";
import { generateEmbeddings } from "../gemini.service.js";
import { TUTOR_SYSTEM_PROMPT } from "../../../config/prompts.js";
import AIUsage from "../../../models/AIUsage.js";

export class TutorAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", false);
  }

  async chat(courseId, lessonContent, chatHistory, userMessage, userMemory = null, userId = null) {
    let memoryConstraint = '';
    if (userMemory && (userMemory.weakTopics?.length > 0 || userMemory.strongTopics?.length > 0)) {
      memoryConstraint = `
Be aware of the student's learning profile:
- They are STRONG at: ${userMemory.strongTopics?.join(', ') || 'N/A'}.
- They are WEAK at: ${userMemory.weakTopics?.join(', ') || 'N/A'}.
Adjust your explanation style accordingly (more patient and analogous for weak topics, more direct for strong topics).
`;
    }

    // --- VECTOR SEARCH (RAG) ---
    let extraContext = '';
    if (courseId) {
      try {
        const CourseChunk = (await import("../../../models/CourseChunk.js")).default;
        const mongoose = (await import("mongoose")).default;
        
        logger.info(`[RAG] Searching chunks for: "${userMessage}"`);
        const queryEmbedding = await generateEmbeddings(userMessage);
        
        const topChunks = await CourseChunk.aggregate([
          {
            $vectorSearch: {
              index: "vector_index", // Name of the index in Atlas
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: 3,
              filter: { courseId: new mongoose.Types.ObjectId(courseId) }
            }
          },
          {
            $project: {
              text: 1,
              score: { $meta: "vectorSearchScore" }
            }
          }
        ]);
        
        if (topChunks.length > 0 && topChunks[0].score > 0.5) {
          extraContext = `\n\nRELEVANT COURSE CONTEXT (from other lessons):\n` + topChunks.map(c => `- ${c.text}`).join('\n');
          logger.info(`[RAG] Found context with top score: ${topChunks[0].score.toFixed(3)}`);
        }
      } catch (err) {
        logger.error("[RAG] Vector search failed:", err);
      }
    }

    const systemPrompt = TUTOR_SYSTEM_PROMPT(lessonContent, extraContext, memoryConstraint);
    
    const geminiHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood! I will act as a helpful AI tutor for this lesson. What is your question?" }] },
      ...chatHistory
    ];

    try {
      const chat = this.model.startChat({ history: geminiHistory });
      const result = await chat.sendMessageStream(userMessage);
      return result.stream;
    } catch (err) {
      logger.error(`[TutorAgent] Gemini streaming failed (${err.message}). Attempting Groq fallback...`);
      
      if (!this.groqClient) {
        throw new Error("Gemini API failed and GROQ_API_KEY is not configured for fallback.");
      }

      // Convert Gemini history to Groq (OpenAI-like) history format
      const groqMessages = [
        { role: "system", content: systemPrompt },
        { role: "assistant", content: "Understood! I will act as a helpful AI tutor for this lesson. What is your question?" },
      ];
      
      for (const msg of chatHistory) {
        const groqRole = msg.role === "model" ? "assistant" : "user";
        const content = msg.parts?.[0]?.text || "";
        groqMessages.push({ role: groqRole, content });
      }
      
      groqMessages.push({ role: "user", content: userMessage });

      const stream = await this.groqClient.chat.completions.create({
        messages: groqMessages,
        model: "llama-3.1-8b-instant",
        stream: true,
      });
      
      logger.info(`[TutorAgent] Groq streaming fallback initiated.`);

      // Create an async generator that mocks the expected Gemini stream interface
      async function* convertGroqStream() {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            yield { text: () => content };
          }
        }
      }

      return convertGroqStream();
    }
  }
}
