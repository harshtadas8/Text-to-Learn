import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJson } from "../../utils/jsonUtils.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateCourseWithGemini(topic, level, language, goal, timeAvailable) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

  const timeConstraint = timeAvailable ? `and they have ${timeAvailable} available to study.` : '';
  const goalConstraint = goal ? `Their primary goal is: "${goal}". Tailor the modules heavily towards achieving this goal.` : '';

  const prompt = `
Generate a ${level} level course on "${topic}" in ${language}.
${goalConstraint}
${timeConstraint}
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

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  return extractJson(rawText);
}

export async function generateQuizWithGemini(courseTopic, moduleTitle, lessonTitle, lessonContent) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

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

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  return extractJson(rawText);
}

export async function chatWithLesson(lessonContent, chatHistory, userMessage) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: `You are an AI Tutor embedded in an e-learning platform.
Your job is to answer the user's questions strictly based on the provided lesson content.
Be encouraging, beginner-friendly, and concise.

LESSON CONTENT:
"""
${lessonContent.substring(0, 8000)}
"""`
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood! I will act as a helpful AI tutor for this lesson. What is your question?"
          }
        ]
      },
      ...chatHistory
    ],
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}
