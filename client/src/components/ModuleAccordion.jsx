import { useState, useEffect } from "react";
import { generateLessonAPI } from "../services/api";
import LessonReelModal from "./LessonReelModal";
import LessonViewer from "./LessonViewer";
import QuizViewer from "./QuizViewer";
import LessonTutor from "./LessonTutor";
import { useSocket } from "../context/SocketContext";
export default function ModuleAccordion({ module, courseId, courseTitle, language, completedLessons = [], onToggleComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [activeReelLessonId, setActiveReelLessonId] = useState(null);
  const [lessonContentMap, setLessonContentMap] = useState({});
  const [loadingLessons, setLoadingLessons] = useState({});
  const [errorLessons, setErrorLessons] = useState({});

  const { socket, roomData, roomCode } = useSocket() || {};
  const isHost = roomData?.hostId === socket?.id;

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
      setErrorLessons(prev => ({ ...prev, [lessonId]: null }));

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
      setErrorLessons(prev => ({ ...prev, [lessonId]: err.message || "Failed to load lesson" }));
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
                  <span className={completedLessons.includes(lessonId) ? "line-through text-gray-500" : ""}>
                    {lesson.lessonIndex}. {lesson.title} {completedLessons.includes(lessonId) && "✅"}
                  </span>
                  <span className="text-blue-400">
                    {loadingLessons[lessonId]
                      ? "⏳"
                      : errorLessons[lessonId]
                      ? "⚠️"
                      : isExpanded
                      ? "▼"
                      : "▶"}
                  </span>
                </button>

                {errorLessons[lessonId] && !loadingLessons[lessonId] && !isExpanded && (
                  <div className="px-4 py-3 bg-red-900/20 border-t border-red-900/50 text-red-400 text-sm flex justify-between items-center">
                    <span>⚠️ {errorLessons[lessonId]}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLessonClick(lesson); }}
                      className="text-xs px-3 py-1 bg-red-900/40 rounded hover:bg-red-900/60"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {isExpanded && lessonContentMap[lessonId] && (
                  <div className="px-4 pt-3 pb-4">
                    <LessonViewer 
                      content={lessonContentMap[lessonId]} 
                      language={language} 
                      reelButton={
                        <button 
                          onClick={() => {
                            setActiveReelLessonId(lessonId);
                            if (isHost && roomCode) {
                              socket.emit("host-opened-reel", { 
                                roomCode, 
                                content: lessonContentMap[lessonId], 
                                lessonTitle: lesson.title, 
                                language 
                              });
                            }
                          }}
                          className="py-2 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-bold rounded-full transition-all shadow-lg flex items-center gap-2 transform hover:scale-105"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Watch as Reel
                        </button>
                      }
                    />
                    
                    <QuizViewer 
                      courseTopic={courseTitle}
                      moduleTitle={module.moduleTitle}
                      lessonTitle={lesson.title}
                      lessonContent={JSON.stringify(lessonContentMap[lessonId])}
                    />

                    <LessonTutor lessonContent={lessonContentMap[lessonId]} courseId={courseId} />

                    {onToggleComplete && (
                      <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <span className="text-gray-400 group-hover:text-white transition">
                            {completedLessons.includes(lessonId) ? "Completed!" : "Mark Complete"}
                          </span>
                          <input 
                            type="checkbox" 
                            checked={completedLessons.includes(lessonId)}
                            onChange={(e) => onToggleComplete(lessonId, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900 bg-gray-800"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RENDER THE ACTIVE REEL MODAL */}
      {activeReelLessonId && (
        <LessonReelModal 
          content={lessonContentMap[activeReelLessonId]} 
          lessonTitle={module.lessons.find(l => `${module.moduleIndex}-${l.lessonIndex}` === activeReelLessonId)?.title}
          language={language}
          onClose={() => {
            setActiveReelLessonId(null);
            if (isHost && roomCode) {
              socket.emit("host-closed-reel", { roomCode });
            }
          }} 
        />
      )}

    </div>
  );
}
