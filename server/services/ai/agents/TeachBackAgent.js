import { logger } from "../../../config/logger.js";
import { BaseAgent } from "./BaseAgent.js";
import { TeachBackEvaluationSchema } from "../../../validators/aiSchemas.js";

export default class TeachBackAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true); // true for JSON response
  }

  async evaluate(sourceText, studentTranscript) {
    const prompt = `
      You are an encouraging and practical teacher evaluating a student's explanation of a concept.
      Please evaluate the following student explanation against the source truth.
      
      CRITICAL INSTRUCTIONS:
      1. Be realistic and lenient. Humans cannot remember every single bullet point.
      2. If the student captures the CORE IDEA or the MAIN GIST of the lesson, they should score highly (80+).
      3. Only penalize heavily if they completely misunderstand the core concept or say something factually wrong.
      4. For "whatWasMissed", ONLY list 1-2 MAJOR concepts they completely omitted. Do NOT nitpick minor details.
      5. For "whatWasWrong", only list actual false statements. Being brief is NOT being wrong.

      SOURCE TRUTH (Lesson Content):
      ${sourceText}

      STUDENT'S EXPLANATION:
      "${studentTranscript}"
      
      Return a JSON response strictly matching this schema:
      {
        "score": number (0-100),
        "whatWasMissed": string[] (Only major concepts omitted, max 2 items),
        "whatWasWrong": string[] (Only factual errors, max 2 items),
        "whatWasGood": string[] (Positive reinforcement for what the student got right)
      }
    `;

    try {
      const { text } = await this.generate(prompt, "system", "teachback-evaluation");
      return this.extractJson(text, TeachBackEvaluationSchema);
    } catch (error) {
      logger.error("TeachBackAgent evaluation failed:", error);
      throw error;
    }
  }
}
