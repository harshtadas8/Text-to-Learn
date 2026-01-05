import { useState } from "react";
import { generateLessonAPI } from "../services/api";
import LessonViewer from "./LessonViewer";

export default function ModuleAccordion({ module, courseId, courseTitle, language, }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [lessonContentMap, setLessonContentMap] = useState({});
  const [loadingLessons, setLoadingLessons] = useState({});

  const toggleModule = () => setIsOpen(prev => !prev);

  const handleLessonClick = async (lesson) => {
    const lessonId = `${module.moduleIndex}-${lesson.lessonIndex}`;

    // collapse
    if (expandedLessonId === lessonId) {
      setExpandedLessonId(null);
      return;
    }

    // already cached in frontend
    if (lessonContentMap[lessonId]) {
      setExpandedLessonId(lessonId);
      return;
    }

    try {
      setLoadingLessons(prev => ({ ...prev, [lessonId]: true }));

      const res = await generateLessonAPI({
        courseId,
        courseTitle,
        moduleIndex: module.moduleIndex,
        moduleTitle: module.moduleTitle,
        lessonIndex: lesson.lessonIndex,
        lessonTitle: lesson.title,
        language,
      });

      setLessonContentMap(prev => ({
        ...prev,
        [lessonId]: res.data,
      }));

      setExpandedLessonId(lessonId);

    } catch (err) {
      console.error("Lesson generation failed", err);
    } finally {
      setLoadingLessons(prev => ({ ...prev, [lessonId]: false }));
    }
  };

  return (
    <div className="border border-gray-800 rounded-xl mb-6 overflow-hidden">
      <button
        onClick={toggleModule}
        className="w-full text-left p-5 bg-gradient-to-r from-gray-900 to-black flex justify-between"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">
            {module.moduleIndex}. {module.moduleTitle}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            🎯 {module.learningObjective}
          </p>
        </div>
        <span className="text-emerald-400 text-xl">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 bg-black">
          {module.lessons.map((lesson) => {
            const lessonId = `${module.moduleIndex}-${lesson.lessonIndex}`;
            const isExpanded = expandedLessonId === lessonId;

            return (
              <div key={lessonId} className="border border-gray-700 rounded-lg">
                <button
                  onClick={() => handleLessonClick(lesson)}
                  className="w-full flex justify-between px-4 py-3 text-left hover:bg-gray-900"
                >
                  <span>
                    {lesson.lessonIndex}. {lesson.title}
                  </span>
                  <span className="text-blue-400">
                    {loadingLessons[lessonId]
                      ? "⏳"
                      : isExpanded
                      ? "▼"
                      : "▶"}
                  </span>
                </button>

                {isExpanded && lessonContentMap[lessonId] && (
                  <div className="px-4 py-4">
                    <LessonViewer content={lessonContentMap[lessonId]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
