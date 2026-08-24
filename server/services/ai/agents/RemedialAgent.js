import { logger } from "../../../config/logger.js";
import { BaseAgent } from "./BaseAgent.js";
import { REMEDIAL_PROMPT, REFRESHER_PROMPT } from "../../../config/prompts.js";

export class RemedialAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", false);
  }

  async generateRemedialLesson(topic, failedQuestions) {
    const failedConcepts = failedQuestions.map(q => `Question: ${q.question}\nCorrect Answer: ${q.correctAnswer}\nStudent Answer: ${q.studentAnswer}`).join('\n\n');
    const prompt = REMEDIAL_PROMPT(topic, failedConcepts);

    try {
      const { text } = await this.generate(prompt, "system", "remedial-lesson");
      return text;
    } catch (error) {
      logger.error("[RemedialAgent] Failed to generate remedial lesson", error);
      throw error;
    }
  }

  async generateRefresherLesson(topic) {
    const prompt = REFRESHER_PROMPT(topic);

    try {
      const { text } = await this.generate(prompt, "system", "refresher-lesson");
      return text;
    } catch (error) {
      logger.error("[RemedialAgent] Failed to generate refresher lesson", error);
      throw error;
    }
  }
}
