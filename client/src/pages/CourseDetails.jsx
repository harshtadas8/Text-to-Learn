import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseByIdAPI, getCourseProgressAPI, markLessonProgressAPI, downloadCoursePdfAPI } from "../services/api";
import ModuleAccordion from "../components/ModuleAccordion";
import CourseSkeleton from "../components/CourseSkeleton";
import { useAuth0 } from "@auth0/auth0-react";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth0();

  const [course, setCourse] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* -------------------- FETCH COURSE & PROGRESS -------------------- */

  useEffect(() => {
    async function fetchCourseData() {
      try {
        const res = await getCourseByIdAPI(id);
        setCourse(res.data);
      } catch (err) {
        console.error("Failed to fetch course:", err);
        setError("Failed to load course");
        setLoading(false);
        return;
      }

      // Fetch progress if authenticated (non-fatal if it fails)
      if (isAuthenticated) {
        try {
          const progRes = await getCourseProgressAPI(id);
          setCompletedLessons(progRes.data || []);
        } catch (progErr) {
          console.warn("Failed to fetch progress (auth might have expired):", progErr);
          // Do NOT set error here, let the course load anyway
        }
      }

      setLoading(false);
    }

    fetchCourseData();
  }, [id, isAuthenticated]);

  /* -------------------- PROGRESS HANDLER -------------------- */

  const handleToggleComplete = async (lessonId, isCompleted) => {
    if (!isAuthenticated) return;
    try {
      if (isCompleted) {
        setCompletedLessons(prev => [...prev, lessonId]);
      } else {
        setCompletedLessons(prev => prev.filter(id => id !== lessonId));
      }
      await markLessonProgressAPI(id, lessonId, isCompleted);
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  /* -------------------- PDF HANDLER (FULL COURSE) -------------------- */

  const handleDownloadPDF = async () => {
    try {
      await downloadCoursePdfAPI(id);
    } catch (err) {
      console.error(err);
      alert("Failed to download full course PDF");
    }
  };

  /* -------------------- LOADING / ERROR -------------------- */

  if (loading) {
    return <CourseSkeleton />;
  }

  if (error || !course || !course.content) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          {error || "We couldn't find the course you're looking for. It may have been deleted or the link is invalid."}
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Return Home
        </button>
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
    <div className="min-h-screen bg-black text-white px-4 py-16 animate-fade-in">
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

          <p className="text-gray-300 leading-relaxed max-w-3xl mb-6">
            {description || "This course does not have a description yet."}
          </p>

          {/* PROGRESS BAR */}
          {isAuthenticated && (
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl max-w-xl">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Course Progress</span>
                <span className="font-semibold text-emerald-400">
                  {completedLessons.length} completed
                </span>
              </div>
              <div className="w-full bg-black rounded-full h-2.5">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${modules.length > 0 ? Math.min(100, Math.round((completedLessons.length / modules.reduce((acc, m) => acc + m.lessons.length, 0)) * 100)) : 0}%` }}
                ></div>
              </div>
            </div>
          )}
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
                completedLessons={completedLessons}
                onToggleComplete={handleToggleComplete}
              />
            ))
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-6">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
          >
            Generate Another Course
          </button>

          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
          >
            Download PDF 📄
          </button>
          
          {isAuthenticated && modules.length > 0 && completedLessons.length === modules.reduce((acc, m) => acc + m.lessons.length, 0) && (
            <button
              onClick={() => navigate(`/certificate/${course._id}`)}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)] transition"
            >
              View Certificate 🏆
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
