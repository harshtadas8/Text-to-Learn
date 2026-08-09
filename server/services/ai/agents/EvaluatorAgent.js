import { BaseAgent } from "./BaseAgent.js";

export class EvaluatorAgent extends BaseAgent {
  constructor() {
    // We use a stronger model for evaluation if needed, but flash is good for structure
    super("gemini-3.5-flash-lite", true);
  }

  async evaluateCourse(courseJson) {
    const prompt = `
You are an expert curriculum evaluator. 
Review the following generated course JSON for quality, structure, and hallucinations.
Check if it follows the basic rules:
1. Valid structure (courseTitle, modules, lessons, resources).
2. Appropriate difficulty level.
3. Logical progression of topics.

Course JSON:
"""
${JSON.stringify(courseJson)}
"""

Return ONLY raw JSON in this exact structure:
{
  "isValid": true/false,
  "feedback": "Explain why it is valid or invalid",
  "fixedCourse": <If invalid but fixable, provide the fixed JSON here. If valid, return the original JSON here>
}
`;
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    return this.extractJson(rawText);
  }
}
