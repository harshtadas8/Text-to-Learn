import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import { generateCourseWithGemini } from "../services/ai/gemini.service.js";

/* =====================================================
   POST /api/courses/generate
===================================================== */
export async function generateCourseController(req, res) {
  try {
    const { topic, level, language = "English" } = req.body;

    // 🔐 Auth0 user id
    const userId = req.auth.sub;

    const content = await generateCourseWithGemini(topic, level, language);

    const course = await Course.create({
      topic,
      level,
      language,
      content,
      userId, // ✅ saved
    });

    res.status(201).json({ success: true, data: course });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Course generation failed" });
  }
}

/* =====================================================
   GET /api/courses/my
   (ONLY logged-in user's courses)
===================================================== */
export async function getMyCourses(req, res) {
  try {
    const userId = req.auth.sub;

    const courses = await Course.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user courses",
    });
  }
}

/* =====================================================
   GET /api/courses/:id
===================================================== */
export async function getCourseById(req, res) {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
}

/* =====================================================
   GET /api/courses/:id/full
===================================================== */
export async function getFullCourseController(req, res) {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).lean();
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // 🔥 Fetch cached lessons
    const lessons = await Lesson.find({ courseId: id }).lean();

    const lessonMap = {};
    lessons.forEach((lesson) => {
      const key = `${lesson.moduleIndex}-${lesson.lessonIndex}`;
      lessonMap[key] = lesson.content;
    });

    course.content.modules.forEach((module) => {
      module.lessons = module.lessons.map((lesson) => {
        const key = `${module.moduleIndex}-${lesson.lessonIndex}`;
        return {
          ...lesson,
          fullContent: lessonMap[key] || null,
        };
      });
    });

    return res.json({
      success: true,
      data: course,
    });

  } catch (error) {
    console.error("❌ Full course fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch full course",
    });
  }
}
