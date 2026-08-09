import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { getDashboardAPI } from "../services/api";

/* Helpers */
function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "U";
}

function getAvatarColor(name = "") {
  const colors = [
    "from-emerald-500 to-teal-500",
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-rose-500 to-red-500",
    "from-amber-500 to-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [stats, setStats] = useState(null);
  const [fetchingStats, setFetchingStats] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchStats = async () => {
        try {
          const res = await getDashboardAPI();
          if (res.success) {
            setStats(res.data.stats);
          }
        } catch (error) {
          console.error("Failed to fetch stats", error);
        } finally {
          setFetchingStats(false);
        }
      };
      fetchStats();
    } else {
      setFetchingStats(false);
    }
  }, [isAuthenticated]);

  if (isLoading || fetchingStats) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Please login to view your profile.
      </div>
    );
  }

  const initials = getInitials(user.name);
  const bgGradient = getAvatarColor(user.name);
  const currentLevel = Math.floor((stats?.xp || 0) / 100) + 1;
  const xpToNextLevel = 100 - ((stats?.xp || 0) % 100);
  const progressPercent = (stats?.xp || 0) % 100;

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        <h1 className="text-2xl sm:text-3xl font-light text-gray-200 border-b border-gray-800 pb-4">
          Learner Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: User Identity */}
          <div className="md:col-span-1 bg-[#0a0a0a] border border-gray-800 rounded-xl p-8 flex flex-col items-center text-center">
            
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br ${bgGradient} text-white font-semibold text-3xl mb-6 shadow-sm`}
            >
              {initials}
            </div>

            <h2 className="text-xl font-medium text-gray-100 mb-1 w-full truncate">
              {user.name || "Unnamed Learner"}
            </h2>
            <p className="text-gray-400 text-sm mb-8 w-full truncate">
              {user.email}
            </p>

            <div className="w-full text-left mt-auto pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Auth Provider</p>
              <p className="capitalize text-gray-300 text-sm font-medium">{user.sub?.split("|")[0]}</p>
            </div>
          </div>

          {/* Right Column: Professional Stats */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Level & XP Card */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">Current Level</p>
                  <h3 className="text-3xl font-light text-gray-100">Level {currentLevel}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">Total Experience</p>
                  <p className="text-xl font-medium text-emerald-400">{stats?.xp || 0} XP</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress to Level {currentLevel + 1}</span>
                  <span>{xpToNextLevel} XP needed</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🔥</span>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Day Streak</p>
                </div>
                <p className="text-3xl font-light text-gray-100">{stats?.streak || 0}</p>
              </div>

              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🎓</span>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Completed</p>
                </div>
                <p className="text-3xl font-light text-gray-100">{stats?.totalCoursesCompleted || 0} Courses</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}