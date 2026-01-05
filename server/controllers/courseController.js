import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import { generateCourseWithGemini } from "../services/ai/gemini.service.js";

/* =====================================================
   POST /api/courses/generate
===================================================== */
export async function generateCourseController(req, res) {
  try {
    const { topic, level, language = "English" } = req.body;

    const content = await generateCourseWithGemini(topic, level, language);

    const course = await Course.create({
      topic,
      level,
      language,
      content,
    });

    res.status(201).json({ success: true, data: course });
  } catch (e) {
    res.status(500).json({ success: false, message: "Course generation failed" });
  }
}

/* =====================================================
   GET /api/courses
===================================================== */
export async function getAllCourses(req, res) {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
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
   (Course + Cached Lessons for PDF)
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

    // 🔥 Create lookup map
    const lessonMap = {};
    lessons.forEach((lesson) => {
      const key = `${lesson.moduleIndex}-${lesson.lessonIndex}`;
      lessonMap[key] = lesson.content;
    });

    // 🔥 Attach lesson content to course structure
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
