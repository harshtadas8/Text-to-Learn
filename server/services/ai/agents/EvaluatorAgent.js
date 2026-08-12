import { BaseAgent } from "./BaseAgent.js";
import { EVALUATOR_PROMPT } from "../../../config/prompts.js";

export class EvaluatorAgent extends BaseAgent {
  constructor() {
    // We use a stronger model for evaluation if needed, but flash is good for structure
    super("gemini-3.5-flash-lite", true);
  }

  async evaluateCourse(courseJson) {
    const prompt = EVALUATOR_PROMPT(courseJson);
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    return this.extractJson(rawText);
  }
}
