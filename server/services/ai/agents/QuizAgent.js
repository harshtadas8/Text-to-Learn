import { BaseAgent } from "./BaseAgent.js";
import { QUIZ_GENERATION_PROMPT } from "../../../config/prompts.js";

export class QuizAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async generateQuiz(courseTopic, moduleTitle, lessonTitle, lessonContent) {
    const prompt = QUIZ_GENERATION_PROMPT(courseTopic, moduleTitle, lessonTitle, lessonContent);
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    return this.extractJson(rawText);
  }
}
