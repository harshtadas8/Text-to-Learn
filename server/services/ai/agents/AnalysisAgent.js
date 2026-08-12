import { BaseAgent } from "./BaseAgent.js";
import { ANALYSIS_PROMPT } from "../../../config/prompts.js";

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async analyzeQuizResults(courseTopic, quizQuestions, userAnswers) {
    const prompt = ANALYSIS_PROMPT(courseTopic, quizQuestions, userAnswers);
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    return this.extractJson(rawText);
  }
}
