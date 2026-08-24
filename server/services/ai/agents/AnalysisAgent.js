import { BaseAgent } from "./BaseAgent.js";
import { ANALYSIS_PROMPT } from "../../../config/prompts.js";
import { AnalysisSchema } from "../../../validators/aiSchemas.js";

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async analyzeQuizResults(courseTopic, quizQuestions, userAnswers) {
    const prompt = ANALYSIS_PROMPT(courseTopic, quizQuestions, userAnswers);
    const { text } = await this.generate(prompt, "system", "quiz-analysis");
    return this.extractJson(text, AnalysisSchema);
  }
}
