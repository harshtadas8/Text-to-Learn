import { BaseAgent } from "./BaseAgent.js";

export class QuizAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async generateQuiz(courseTopic, moduleTitle, lessonTitle, lessonContent) {
    const prompt = `
Generate a 3-question multiple choice quiz based strictly on the following lesson from the course "${courseTopic}" -> Module: "${moduleTitle}" -> Lesson: "${lessonTitle}".

Lesson Content:
"""
${lessonContent.substring(0, 5000)}
"""

Return ONLY raw JSON in this exact structure:
{
  "questions": [
    {
      "question": "What is ...?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "A is correct because..."
    }
  ]
}
`;
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    return this.extractJson(rawText);
  }
}
