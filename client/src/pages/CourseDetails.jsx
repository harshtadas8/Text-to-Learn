import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseByIdAPI, getFullCourseAPI } from "../services/api";
import ModuleAccordion from "../components/ModuleAccordion";
import { generateCoursePDF } from "../utils/coursePdf";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* -------------------- FETCH COURSE (OUTLINE ONLY) -------------------- */

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await getCourseByIdAPI(id);
        setCourse(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  /* -------------------- PDF HANDLER (FULL COURSE) -------------------- */

  const handleDownloadPDF = async () => {
    try {
      const res = await getFullCourseAPI(id); // ✅ FULL COURSE WITH LESSONS
      generateCoursePDF(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate full course PDF");
    }
  };

  /* -------------------- LOADING / ERROR -------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading course...
      </div>
    );
  }

  if (error || !course || !course.content) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        {error || "Course not found"}
      </div>
    );
  }

  /* -------------------- SAFE DATA -------------------- */

  const {
    topic,
    level,
    language,
    content: { courseTitle, description, modules = [] },
  } = course;

  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-black text-white px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* META */}
        <div>
          <p className="text-sm text-gray-400 mb-2">
            Level: <span className="text-emerald-400">{level}</span> •
            Topic: <span className="text-emerald-400">{topic}</span>
          </p>

          <h1 className="text-4xl font-bold text-emerald-400 mb-4">
            {courseTitle || "Untitled Course"}
          </h1>

          <p className="text-gray-300 leading-relaxed max-w-3xl">
            {description || "This course does not have a description yet."}
          </p>
        </div>

        {/* MODULES */}
        <div>
          {modules.length === 0 ? (
            <p className="text-gray-400">
              No modules generated for this course.
            </p>
          ) : (
            modules.map((module, index) => (
              <ModuleAccordion
                key={index}
                module={module}
                courseId={course._id}       // ✅ REQUIRED FOR CACHING
                courseTitle={courseTitle}
                language={language}
              />
            ))
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-4 pt-6">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
          >
            ← Generate Another Course
          </button>

          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
          >
            Download PDF 📄
          </button>
        </div>

      </div>
    </div>
  );
}
