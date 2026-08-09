import { BaseAgent } from "./BaseAgent.js";

export class LessonAgent extends BaseAgent {
  constructor() {
    super("gemini-3.5-flash-lite", true);
  }

  async generateCourse(topic, level, language, goal, timeAvailable, userMemory = null) {
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

    const prompt = `
Generate a ${level} level course on "${topic}" in ${language}.
${goalConstraint}
${timeConstraint}
${memoryConstraint}
Return ONLY raw JSON in this structure:

{
  "courseTitle": "",
  "level": "${level}",
  "description": "",
  "modules": [
    {
      "moduleIndex": 1,
      "moduleTitle": "",
      "learningObjective": "",
      "lessons": [
        {
          "lessonIndex": 1,
          "title": ""
        }
      ],
      "resources": {
        "videos": [
          "YouTube search query relevant to this module"
        ],
        "blogs": [
          "Relevant blog or documentation source name"
        ]
      }
    }
  ]
}

Rules:
- Max 5 modules
- Max 5 lessons per module
- Resources MUST be present for every module
- Videos must be SEARCH QUERIES, not URLs
- Blogs must be site or documentation names, not links
- Beginner-friendly language
- NO markdown
- NO explanations
- RAW JSON ONLY
`;
    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();
    return this.extractJson(rawText);
  }
}
