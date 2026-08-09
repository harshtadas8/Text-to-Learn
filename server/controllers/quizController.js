import { generateQuizWithGemini } from "../services/ai/gemini.service.js";
import { aiQueue } from "../config/queue.js";
import User from "../models/User.js";

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

/* =====================================================
   POST /api/quizzes/submit
===================================================== */
export async function submitQuizController(req, res) {
  try {
    const { courseTopic, quizQuestions, userAnswers } = req.body;
    const userId = req.auth.sub;

    // We respond immediately so the frontend score updates instantly
    res.status(200).json({ success: true, message: "Quiz submitted, memory analysis started in background." });

    // Calculate score based on userAnswers array
    let correctCount = 0;
    userAnswers.forEach(ans => {
      if (ans.isCorrect) correctCount++;
    });

    // --- BACKGROUND QUEUE PROCESSING ---
    
    // Dispatch memory-analysis job
    await aiQueue.add("memory-analysis", {
      userId,
      courseTopic,
      quizQuestions,
      userAnswers,
      correctCount
    });

    // Trigger Remedial Agent if score is less than 60%
    const scorePercentage = (correctCount / quizQuestions.length) * 100;
    if (scorePercentage < 60) {
      const failedQuestions = userAnswers.filter(ans => !ans.isCorrect).map(ans => ({
        question: ans.question,
        correctAnswer: ans.correctAnswer,
        studentAnswer: ans.userAnswer || "No answer provided"
      }));
      
      // Dispatch remedial-lesson job
      await aiQueue.add("remedial-lesson", {
        userId,
        courseTopic,
        failedQuestions
      });
    }

  } catch (error) {
    console.error("Quiz submission error:", error);
    // Even if it fails to start, we don't want to crash the frontend quiz flow
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Failed to submit quiz" });
    }
  }
}

