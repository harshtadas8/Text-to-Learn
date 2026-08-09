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
          <div className="bg-gradient-to-r from-gray-900 to-black border border-emerald-500/30 p-6 rounded-xl mb-8 animate-slide-up flex flex-col md:flex-row items-center justify-between shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl font-bold">
                Lvl {Math.floor((stats?.xp || 0) / 100) + 1}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Your Progress</h3>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span>✨ {stats?.xp || 0} Total XP</span>
                  <span>•</span>
                  <span>Next level in {100 - ((stats?.xp || 0) % 100)} XP</span>
                </div>
                {/* XP Bar */}
                <div className="w-48 bg-gray-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${((stats?.xp || 0) % 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/30 px-6 py-3 rounded-xl flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-xs text-orange-300 font-semibold uppercase tracking-wider">Daily Streak</p>
                <p className="text-2xl font-bold text-white">{stats?.streak || 0} {stats?.streak === 1 ? 'Day' : 'Days'}</p>
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
