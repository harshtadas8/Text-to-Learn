import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getDashboardAPI } from "../services/api";
import CourseGridSkeleton from "../components/CourseGridSkeleton";

export default function Courses() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  const [dashboardData, setDashboardData] = useState({ stats: null, recentCourses: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await getDashboardAPI();
        setDashboardData(res.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isAuthenticated]);

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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
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

                return (
                  <div
                    key={course._id}
                    style={{ animationDelay: `${i * 100}ms` }}
                    className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-5 hover:border-emerald-400 transition transform hover:-translate-y-1 cursor-pointer animate-slide-up flex flex-col"
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    <h2 className="text-xl font-semibold mb-2 line-clamp-2">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
