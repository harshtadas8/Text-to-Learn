import { BaseAgent } from "./BaseAgent.js";
import { EVALUATOR_PROMPT } from "../../../config/prompts.js";
import { EvaluatorSchema } from "../../../validators/aiSchemas.js";

export class EvaluatorAgent extends BaseAgent {
  constructor() {
    // We use a stronger model for evaluation if needed, but flash is good for structure
    super("gemini-3.5-flash-lite", true);
  }

  async evaluateCourse(courseJson) {
    const prompt = EVALUATOR_PROMPT(courseJson);
    const { text } = await this.generate(prompt, "system", "course-evaluation");
    return this.extractJson(text, EvaluatorSchema);
  }
}
