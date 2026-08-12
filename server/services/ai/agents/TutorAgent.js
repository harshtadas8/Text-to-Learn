import { BaseAgent } from "./BaseAgent.js";
import Course from "../../../models/Course.js";
import { generateEmbeddings } from "../gemini.service.js";
import { TUTOR_SYSTEM_PROMPT } from "../../../config/prompts.js";

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class TutorAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", false);
  }

  async chat(courseId, lessonContent, chatHistory, userMessage, userMemory = null) {
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
        
        console.log(`[RAG] Searching chunks for: "${userMessage}"`);
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
        
        if (topChunks.length > 0 && topChunks[0].score > 0.5) { // Threshold
          extraContext = `\n\nRELEVANT COURSE CONTEXT (from other lessons):\n` + topChunks.map(c => `- ${c.text}`).join('\n');
          console.log(`[RAG] Found context with top score: ${topChunks[0].score.toFixed(3)}`);
        }
      } catch (err) {
        console.error("[RAG] Vector search failed:", err);
      }
    }

    const chat = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: TUTOR_SYSTEM_PROMPT(lessonContent, extraContext, memoryConstraint)
            }
          ]
        },
        {
          role: "model",
          parts: [
            {
              text: "Understood! I will act as a helpful AI tutor for this lesson. What is your question?"
            }
          ]
        },
        ...chatHistory
      ],
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  }
}
