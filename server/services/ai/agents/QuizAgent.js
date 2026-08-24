import { BaseAgent } from "./BaseAgent.js";
import { QUIZ_GENERATION_PROMPT, DIAGNOSTIC_QUIZ_PROMPT } from "../../../config/prompts.js";
import { QuizSchema, DiagnosticQuizSchema } from "../../../validators/aiSchemas.js";

export class QuizAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async generateQuiz(courseTopic, moduleTitle, lessonTitle, lessonContent) {
    const prompt = QUIZ_GENERATION_PROMPT(courseTopic, moduleTitle, lessonTitle, lessonContent);
    const { text } = await this.generate(prompt, "system", "quiz-generation");
    return this.extractJson(text, QuizSchema);
  }

  async generateDiagnosticQuiz(topic, language, sourceMaterial = '') {
    const prompt = DIAGNOSTIC_QUIZ_PROMPT(topic, language, sourceMaterial);
    const { text } = await this.generate(prompt, "system", "diagnostic-quiz");
    return this.extractJson(text, DiagnosticQuizSchema);
  }
}
