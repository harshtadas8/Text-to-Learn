import Lesson from "../models/Lesson.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJson } from "../utils/jsonUtils.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function generateLessonPrompt(courseTitle, moduleTitle, lessonTitle, language) {
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

Generate a detailed lesson.

Course: "${courseTitle}"
Module: "${moduleTitle}"
Lesson: "${lessonTitle}"

LANGUAGE RULES:
${languageRules}

Return JSON ONLY in this exact structure:
{
  "lessonTitle": "",
  "objectives": [],
  "content": [
    { "type": "heading", "text": "" },
    { "type": "paragraph", "text": "" },
    { "type": "code", "language": "", "code": "" },
    { "type": "video", "query": "" }
  ]
}

Rules:
- NO markdown
- NO explanations outside JSON
- Include EXACTLY one video block
- Video query must be specific to lesson
`;
}

export async function generateLessonController(req, res) {
  try {
    const {
      courseId,
      courseTitle,
      moduleIndex,
      moduleTitle,
      lessonIndex,
      lessonTitle,
      language = "English",
    } = req.body;

    // 🔍 CACHE CHECK (language-aware)
    const cached = await Lesson.findOne({
      courseId,
      moduleIndex,
      lessonIndex,
      language,
    });

    if (cached) {
      return res.json({
        success: true,
        data: cached.content,
        cached: true,
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = generateLessonPrompt(
      courseTitle,
      moduleTitle,
      lessonTitle,
      language
    );

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const lessonData = extractJson(rawText);

    // 💾 SAVE WITH LANGUAGE
    await Lesson.create({
      courseId,
      moduleIndex,
      lessonIndex,
      lessonTitle,
      language,
      content: lessonData,
    });

    return res.json({
      success: true,
      data: lessonData,
      cached: false,
    });

  } catch (err) {
    console.error("❌ Lesson generation error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Lesson generation failed",
    });
  }
}
