export const TUTOR_SYSTEM_PROMPT = (lessonContent, extraContext, memoryConstraint) => `You are an AI Tutor embedded in an e-learning platform.
Your job is to answer the user's questions based on the provided lesson content and any extra context.
Be encouraging, beginner-friendly, and concise.
${memoryConstraint}

CURRENT LESSON CONTENT:
"""
${lessonContent.substring(0, 8000)}
"""${extraContext}`;

export const QUIZ_GENERATION_PROMPT = (courseTopic, moduleTitle, lessonTitle, lessonContent) => `
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

export const REMEDIAL_PROMPT = (topic, failedConcepts) => `You are an empathetic, encouraging AI Remedial Teacher.
The student has just failed a quiz on ${topic}.
Based on the questions they got wrong, generate a very short, highly focused "Micro-Lesson" (max 300 words).
Focus ONLY on explaining the concepts they missed in a simple, easy-to-understand way.
Use analogies if helpful. Do not scold them.
Return the output in Markdown format without a markdown codeblock around it.

Here are the questions the student got wrong:
${failedConcepts}

Please generate the remedial micro-lesson now.`;

export const LESSON_GENERATION_PROMPT = (topic, level, language, goalConstraint, timeConstraint, memoryConstraint) => `
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
- Generate 5 to 8 modules depending on the complexity of the topic (use fewer only if the topic is extremely narrow)
- Generate 5 to 6 lessons per module
- Resources MUST be present for every module
- Videos must be SEARCH QUERIES, not URLs
- Blogs must be site or documentation names, not links
- Beginner-friendly language
- NO markdown
- NO explanations
- RAW JSON ONLY
`;

export const EVALUATOR_PROMPT = (courseJson) => `
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

export const ANALYSIS_PROMPT = (courseTopic, quizQuestions, userAnswers) => `
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

export const LESSON_DETAIL_PROMPT = (courseTitle, moduleTitle, lessonTitle, language, memoryConstraint = "") => {
  let languageRules = "";

  if (language === "Marathi") {
    languageRules = `
- Use Marathi language ONLY
- Use Devanagari script
- Do NOT use English except unavoidable technical terms
`;
  } else if (language === "Hindi") {
    languageRules = `
- Use Hindi language ONLY
- Use Devanagari script
- Do NOT use English except unavoidable technical terms
`;
  } else if (language === "Hinglish") {
    languageRules = `
- Use Hinglish (Hindi language written in English letters)
- Do NOT use Devanagari
- Example: "Iska matlab ye hota hai ki..."
`;
  } else {
    languageRules = `
- Use clear beginner-friendly English
`;
  }

  return `
You are an API that returns ONLY valid JSON.

Generate a HIGHLY COMPREHENSIVE, in-depth lesson. 
The user is relying on this content to fully understand the topic. 
Do NOT generate a short summary. Your output must be exhaustive, rich, and detailed.
Provide deep conceptual explanations, step-by-step breakdowns, real-world analogies, and practical examples.
Aim for at least 6-8 detailed paragraphs and multiple logical sub-headings to break down the topic. Only include code blocks if the topic is specifically related to programming or IT; do NOT use code blocks for general bullet points or non-technical subjects.

Course: "${courseTitle}"
Module: "${moduleTitle}"
Lesson: "${lessonTitle}"

LANGUAGE RULES:
${languageRules}

${memoryConstraint}

Return JSON ONLY in this exact structure:
{
  "lessonTitle": "",
  "objectives": [],
  "content": [
    { "type": "heading", "text": "" },
    { "type": "paragraph", "text": "" },
    { "type": "list", "items": ["point 1", "point 2"] },
    { "type": "code", "language": "", "code": "" },
    { "type": "video", "query": "" }
  ]
}

Rules:
- NO markdown
- NO explanations outside JSON
- Balance long paragraphs with bulleted lists to keep the reader engaged.
- Include EXACTLY one video block
- Video query must be specific to lesson
`;
};
