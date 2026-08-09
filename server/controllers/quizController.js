import { generateQuizWithGemini } from "../services/ai/gemini.service.js";

/* =====================================================
   POST /api/quizzes/generate
===================================================== */
export async function generateQuizController(req, res) {
  try {
    const { courseTopic, moduleTitle, lessonTitle, lessonContent } = req.body;

    if (!lessonContent || !lessonTitle) {
      return res.status(400).json({ success: false, message: "Missing lesson details" });
    }

    const quizData = await generateQuizWithGemini(courseTopic, moduleTitle, lessonTitle, lessonContent);

    if (!quizData || !quizData.questions) {
      throw new Error("Failed to generate quiz from AI");
    }

    return res.status(201).json({
      success: true,
      data: quizData
    });

  } catch (error) {
    console.error("Quiz generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Quiz generation failed"
    });
  }
}
