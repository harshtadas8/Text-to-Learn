import { BaseAgent } from "./BaseAgent.js";
import { LESSON_GENERATION_PROMPT } from "../../../config/prompts.js";
import { CourseSchema } from "../../../validators/aiSchemas.js";

export class LessonAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async generateCourse(topic, level, language, goal, timeAvailable, userMemory = null, sourceMaterial = '') {
    const timeConstraint = timeAvailable ? `and they have ${timeAvailable} available to study.` : '';
    const goalConstraint = goal ? `Their primary goal is: "${goal}". Tailor the modules heavily towards achieving this goal.` : '';
    
    let memoryConstraint = '';
    if (userMemory && (userMemory.weakTopics?.length > 0 || userMemory.strongTopics?.length > 0)) {
      memoryConstraint = `
User Adaptive Profile:
- The user is STRONG at: ${userMemory.strongTopics?.join(', ') || 'N/A'} (Skip the absolute basics for these topics if they appear).
- The user is WEAK at: ${userMemory.weakTopics?.join(', ') || 'N/A'} (Explain these topics in much simpler terms if they appear, providing more analogies).
`;
    }

    const userId = userMemory ? userMemory.auth0Id : "system";
    const prompt = LESSON_GENERATION_PROMPT(topic, level, language, goalConstraint, timeConstraint, memoryConstraint, sourceMaterial);
    
    const { text } = await this.generate(prompt, userId, "course-generation");
    
    // Validates JSON structurally before returning
    return this.extractJson(text, CourseSchema);
  }
}
