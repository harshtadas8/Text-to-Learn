import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateCourseWithGemini(topic, level, language) {
  // const model = genAI.getGenerativeModel({
  //   model: "gemini-1.5-flash",
  //   generationConfig: {
  //     responseMimeType: "application/json",
  //     temperature: 0.4
  //   }
  // });
  const model = genAI.getGenerativeModel({
  // The 'lite' model allows ~1,500 requests/day (vs 20 for standard)
  // Use this ONLY if 2.5-flash-lite fails
// model: "gemini-2.5-flash-lite",
model: "gemini-3-flash-preview",
  generationConfig: { responseMimeType: "application/json" }
});
  const prompt = `
Generate a ${level} level course on "${topic}"in ${language}.
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


  // try {
  //   const result = await model.generateContent(prompt);
  //   const response = await result.response;
  //   const text = response.text();

  //   return JSON.parse(text);
  // } catch (error) {
  //   console.error("Gemini API Error:", error);
  //   return null;
  // }
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
