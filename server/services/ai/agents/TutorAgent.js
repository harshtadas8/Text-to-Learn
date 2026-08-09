import { BaseAgent } from "./BaseAgent.js";
import Course from "../../../models/Course.js";
import { generateEmbeddings } from "../gemini.service.js";

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
        const course = await Course.findById(courseId).lean();
        if (course && course.chunks && course.chunks.length > 0) {
          console.log(`[RAG] Searching ${course.chunks.length} chunks for: "${userMessage}"`);
          const queryEmbedding = await generateEmbeddings(userMessage);
          
          // Calculate similarity for all chunks
          const scoredChunks = course.chunks.map(chunk => ({
            text: chunk.text,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
          }));
          
          // Sort by highest similarity
          scoredChunks.sort((a, b) => b.score - a.score);
          
          // Take top 3 most relevant chunks
          const topChunks = scoredChunks.slice(0, 3);
          
          if (topChunks[0].score > 0.5) { // Threshold
            extraContext = `\n\nRELEVANT COURSE CONTEXT (from other lessons):\n` + topChunks.map(c => `- ${c.text}`).join('\n');
            console.log(`[RAG] Found context with top score: ${topChunks[0].score.toFixed(3)}`);
          }
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
              text: `You are an AI Tutor embedded in an e-learning platform.
Your job is to answer the user's questions based on the provided lesson content and any extra context.
Be encouraging, beginner-friendly, and concise.
${memoryConstraint}

CURRENT LESSON CONTENT:
"""
${lessonContent.substring(0, 8000)}
"""${extraContext}`
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
