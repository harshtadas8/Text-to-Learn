import Certificate from "../models/Certificate.js";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import { logger } from "../config/logger.js";

/* =====================================================
   POST /api/certificates/issue/:courseId
   Issues or returns an existing certificate for a course
===================================================== */
export async function issueCertificate(req, res) {
  try {
    const auth0Id = req.auth.sub;
    const { courseId } = req.params;
    const { userName } = req.body; // Passed from frontend (Auth0 profile)

    if (!userName) {
      return res.status(400).json({ success: false, message: "User name is required for the certificate" });
    }

    // 1. Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // 2. Check if progress is 100%
    const progress = await Progress.findOne({ userId: auth0Id, courseId });
    if (!progress) {
      return res.status(400).json({ success: false, message: "No progress found" });
    }

    let totalLessons = 0;
    if (course.content && course.content.modules) {
      course.content.modules.forEach(m => {
        totalLessons += (m.lessons ? m.lessons.length : 0);
      });
    }

    if (totalLessons === 0 || progress.completedLessons.length < totalLessons) {
      return res.status(400).json({ success: false, message: "Course not fully completed" });
    }

    // 3. Check if certificate already exists
    let cert = await Certificate.findOne({ userId: auth0Id, courseId });
    if (!cert) {
      // 4. Create new certificate
      cert = await Certificate.create({
        userId: auth0Id,
        userName,
        courseId,
        courseTopic: course.topic,
        courseLevel: course.level,
        courseLanguage: course.language
      });
      logger.info(\`[Cert] Issued new certificate \${cert.certId} for user \${auth0Id}\`);
    }

    return res.json({ success: true, certId: cert.certId });
  } catch (error) {
    logger.error("Error issuing certificate:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/* =====================================================
   GET /api/certificates/:certId
   Public route to view a verified certificate
===================================================== */
export async function getCertificate(req, res) {
  try {
    const { certId } = req.params;
    
    const cert = await Certificate.findOne({ certId }).lean();
    if (!cert) {
      return res.status(404).json({ success: false, message: "Invalid or expired certificate" });
    }

    return res.json({ success: true, data: cert });
  } catch (error) {
    logger.error("Error fetching certificate:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
