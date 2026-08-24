import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getDashboardAPI, deleteCourseAPI, getDueCardsAPI, generateRefresherAPI } from "../services/api";
import { useSocket } from "../context/SocketContext";
import CourseGridSkeleton from "../components/CourseGridSkeleton";
import ReactMarkdown from "react-markdown";

export default function Courses() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();

  const [dashboardData, setDashboardData] = useState({ stats: null, recentCourses: [] });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  const [generatingRefresher, setGeneratingRefresher] = useState(false);
  const [viewingRefresher, setViewingRefresher] = useState(null);

  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleNotif = () => fetchDashboard();
      socket.on("new_notification", handleNotif);
      return () => socket.off("new_notification", handleNotif);
    }
  }, [socket]);

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) {
      setLoading(false);
      return;
    }

    fetchDashboard();
  }, [isAuthenticated, user]);

  const fetchDashboard = async () => {
    try {
      const [res, dueRes] = await Promise.all([
        getDashboardAPI(true),
        getDueCardsAPI(user.sub)
      ]);
      setDashboardData(res.data);
      if (dueRes.success && dueRes.data) {
        setDueCount(dueRes.data.length);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, courseId) => {
    e.stopPropagation(); // Prevent navigating to the course
    setDeletingId(courseId);
  };

  const confirmDelete = async (e, courseId) => {
    e.stopPropagation();
    try {
      await deleteCourseAPI(courseId);
      // Refresh dashboard data after deletion
      await fetchDashboard();
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Failed to delete course. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  const handleGenerateRefresher = async (topic) => {
    try {
      setGeneratingRefresher(true);
      await generateRefresherAPI(topic);
      // Wait for socket to trigger fetchDashboard and change the UI.
    } catch (err) {
      console.error(err);
      alert("Failed to start generation.");
      setGeneratingRefresher(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center animate-fade-in">
        <p className="mb-4 text-gray-400">Please login to view your dashboard.</p>
        <button
          onClick={() => loginWithRedirect()}
          className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition"
        >
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return <CourseGridSkeleton />;
  }

  const { stats, recentCourses } = dashboardData;

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER & STATS */}
        <div>
          <h1 className="text-3xl font-bold mb-6 text-emerald-400">
            My Learning Dashboard
          </h1>
          
          {/* PLAYER STATS BANNER */}
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl mb-8 animate-slide-up flex flex-col md:flex-row items-center md:items-start justify-between gap-6 backdrop-blur-sm">
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left w-full md:w-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-inner shrink-0">
                Lv.{Math.floor((stats?.xp || 0) / 100) + 1}
              </div>
              <div className="w-full max-w-[250px] md:max-w-none mx-auto md:mx-0">
                <h3 className="text-lg font-semibold text-white tracking-wide">Your Progress</h3>
                <div className="text-sm text-gray-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                  <span className="font-medium text-emerald-400">{stats?.xp || 0} XP</span>
                  <span className="opacity-50">•</span>
                  <span>{100 - ((stats?.xp || 0) % 100)} XP to next level</span>
                </div>
                {/* XP Bar */}
                <div className="w-full bg-gray-950 rounded-full h-1.5 mt-3 overflow-hidden border border-gray-800">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${((stats?.xp || 0) % 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto bg-gray-950/50 border border-gray-800 px-5 py-3 rounded-xl flex items-center justify-center gap-3 transition hover:border-orange-500/30 group">
              <span className="text-2xl opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">🔥</span>
              <div className="text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Daily Streak</p>
                <p className="text-lg font-semibold text-gray-200">{stats?.streak || 0} {stats?.streak === 1 ? 'Day' : 'Days'}</p>
              </div>
            </div>
            
          </div>

          {/* TODAY'S FOCUS WIDGET */}
          {stats?.weakTopics?.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 p-6 rounded-2xl mb-8 animate-slide-up flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-xl font-bold text-white tracking-wide">Today's Focus</h3>
                </div>
                <p className="text-gray-300 text-sm max-w-md">
                  Our AI noticed you struggled a bit with <span className="font-bold text-blue-400">"{stats.weakTopics[0]}"</span>. 
                  Want a quick 5-minute refresher to solidify your understanding?
                </p>
              </div>
              
              <div className="flex flex-col gap-2 min-w-[200px]">
                {stats.remedials?.find(r => r.topic.includes(stats.weakTopics[0])) ? (
                  <button 
                    onClick={() => setViewingRefresher(stats.remedials.find(r => r.topic.includes(stats.weakTopics[0])))}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/20"
                  >
                    Read Refresher
                  </button>
                ) : (
                  <button 
                    onClick={() => handleGenerateRefresher(stats.weakTopics[0])}
                    disabled={generatingRefresher}
                    className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generatingRefresher ? (
                      <><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Generating...</>
                    ) : (
                      "Generate 5-min Refresher"
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-slide-up">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <p className="text-gray-400 text-sm">Courses Generated</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalCourses || 0}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <p className="text-gray-400 text-sm">Courses in Progress</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{stats?.totalCoursesInProgress || 0}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <p className="text-gray-400 text-sm">Courses Completed</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{stats?.totalCoursesCompleted || 0}</p>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-900/50 p-6 rounded-xl md:col-span-2 cursor-pointer hover:bg-emerald-900/30 transition flex items-center justify-between" onClick={() => navigate("/review")}>
              <div>
                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Spaced Repetition</p>
                <p className="text-2xl font-bold text-white mt-1">Cards Due: {dueCount}</p>
              </div>
              <div className="text-4xl">{dueCount > 0 ? "🧠" : "🎉"}</div>
            </div>
          </div>
        </div>

        {/* COURSES SECTION */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Saved Courses</h2>
          
          {recentCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 animate-slide-up">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2">No courses yet</h2>
              <p className="text-gray-400 mb-6 text-center max-w-md">
                You haven't generated any learning paths yet. Let AI create a personalized course for you!
              </p>
              <Link
                to="/"
                className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition"
              >
                Generate First Course
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentCourses.map((course, i) => {
                const percent = course.totalLessons > 0 
                  ? Math.round((course.completedLessonsCount / course.totalLessons) * 100) 
                  : 0;

                const isDeleting = deletingId === course._id;

                return (
                  <div
                    key={course._id}
                    style={{ animationDelay: `${i * 100}ms` }}
                    className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-5 hover:border-emerald-400 transition transform hover:-translate-y-1 cursor-pointer animate-slide-up flex flex-col group overflow-hidden"
                    onClick={() => !isDeleting && navigate(`/course/${course._id}`)}
                  >
                    <h2 className="text-xl font-semibold mb-2 line-clamp-2 pr-8">
                      {course.topic}
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Level: {course.level}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-emerald-400 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Created: {new Date(course.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Delete Button */}
                    {!isDeleting && (
                      <button
                        onClick={(e) => handleDeleteClick(e, course._id)}
                        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 bg-gray-900/80 rounded-full z-10"
                        title="Delete Course"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}

                    {/* Delete Confirmation Overlay */}
                    {isDeleting && (
                      <div className="absolute inset-0 bg-red-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 animate-fade-in">
                        <p className="text-white font-bold text-center mb-4">Delete this course?</p>
                        <div className="flex gap-3 w-full">
                          <button
                            onClick={(e) => cancelDelete(e)}
                            className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => confirmDelete(e, course._id)}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* REFRESHER MODAL */}
      {viewingRefresher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🎯</span> {viewingRefresher.topic}
                </h3>
                <p className="text-sm text-blue-400 mt-1">Today's Focus Refresher</p>
              </div>
              <button 
                onClick={() => setViewingRefresher(null)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto prose prose-invert prose-emerald max-w-none text-gray-300">
              <ReactMarkdown>{viewingRefresher.content}</ReactMarkdown>
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-gray-900/50 rounded-b-2xl flex justify-end">
              <button 
                onClick={() => setViewingRefresher(null)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
