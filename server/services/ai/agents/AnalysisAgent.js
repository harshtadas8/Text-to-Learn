import { BaseAgent } from "./BaseAgent.js";

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async analyzeQuizResults(courseTopic, quizQuestions, userAnswers) {
    const prompt = `
You are an AI Learning Analyst. 
A student just completed a quiz on the topic "${courseTopic}". 
Analyze the questions they got wrong and the questions they got right to determine their weak topics and strong topics.

Quiz Data:
Questions: ${JSON.stringify(quizQuestions)}
User Answers: ${JSON.stringify(userAnswers)}

Extract 1 to 3 core concepts they are STRONG at (based on correct answers).
Extract 1 to 3 core concepts they are WEAK at (based on incorrect answers).
Be concise (2-4 words per concept).

Return ONLY raw JSON in this exact structure:
{
  "newStrongTopics": ["Concept A", "Concept B"],
  "newWeakTopics": ["Concept C"]
}
`;
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    return this.extractJson(rawText);
  }
}
