import { chatWithLesson } from "../services/ai/gemini.service.js";

export async function handleTutorChat(req, res) {
  try {
    const { lessonContent, history, message } = req.body;

    if (!lessonContent || !message) {
      return res.status(400).json({
        success: false,
        message: "lessonContent and message are required"
      });
    }

    // history should be an array of objects: { role: 'user' | 'model', parts: [{text: '...'}] }
    const chatHistory = history || [];

    const reply = await chatWithLesson(lessonContent, chatHistory, message);

    return res.json({
      success: true,
      data: {
        reply
      }
    });

  } catch (err) {
    console.error("❌ Tutor chat error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get response from AI Tutor"
    });
  }
}
