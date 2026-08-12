import { BaseAgent } from "./BaseAgent.js";
import { REMEDIAL_PROMPT } from "../../../config/prompts.js";

export class RemedialAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", false);
  }

  async generateRemedialLesson(topic, failedQuestions) {
    // Add system instruction inside the model config by getting a new model instance if needed,
    // or just pass it in the prompt. Since BaseAgent doesn't allow systemInstruction in constructor,
    // we can either modify BaseAgent OR just prepend the system instruction to the prompt.
    // Prepending is safer and doesn't require modifying BaseAgent.
    
    const failedConcepts = failedQuestions.map(q => `Question: ${q.question}\nCorrect Answer: ${q.correctAnswer}\nStudent Answer: ${q.studentAnswer}`).join('\n\n');
    const prompt = REMEDIAL_PROMPT(topic, failedConcepts);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("[RemedialAgent] Failed to generate remedial lesson", error);
      throw error;
    }
  }
}
