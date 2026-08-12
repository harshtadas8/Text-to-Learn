import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { getDashboardAPI } from "../services/api";
import DashboardCharts from "../components/Analytics/DashboardCharts";
import ReactMarkdown from "react-markdown";

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
  const [expandedRemedial, setExpandedRemedial] = useState(null);

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

            {/* AI Learning Memory */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-light text-gray-200 mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
                <span className="text-emerald-400">🧠</span> AI Learning Profile
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Strong Topics */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-emerald-500">💪</span> Strong Topics
                  </h4>
                  {stats?.strongTopics && stats.strongTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {stats.strongTopics.slice().reverse().map((topic, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Take some quizzes to discover your strengths!</p>
                  )}
                </div>

                {/* Weak Topics */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-rose-500">🎯</span> Needs Review
                  </h4>
                  {stats?.weakTopics && stats.weakTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {stats.weakTopics.slice().reverse().map((topic, i) => (
                        <span key={i} className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">You're doing great! Keep it up.</p>
                  )}
                </div>
              </div>
              <p className="mt-6 text-xs text-gray-500">
                Your AI Tutor and Course Generator automatically adapt to your learning profile to provide a personalized experience.
              </p>
            </div>

            {/* Targeted Review (Remedials) */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-light text-gray-200 mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
                <span className="text-purple-400">🎯</span> Targeted Review
              </h3>
              
              <p className="text-sm text-gray-400 mb-6">
                These are custom mini-lessons generated by your AI Tutor based on questions you missed in quizzes. Review them to overcome your weaknesses!
              </p>
              
              {stats?.remedials && stats.remedials.length > 0 ? (
                <div className="space-y-4">
                  {stats.remedials.slice().reverse().map((remedial, idx) => {
                    const isExpanded = expandedRemedial === idx;
                    return (
                      <div key={idx} className="border border-gray-800 rounded-lg overflow-hidden bg-black transition-all">
                        <button
                          onClick={() => setExpandedRemedial(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-800/80 transition-colors"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-gray-200 font-medium">{remedial.topic}</span>
                            <span className="text-xs text-gray-500">{new Date(remedial.date).toLocaleDateString()}</span>
                          </div>
                          <span className="text-gray-400 text-xl font-light">{isExpanded ? "−" : "+"}</span>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-6 text-sm text-gray-300 leading-relaxed border-t border-gray-800">
                            <ReactMarkdown
                              components={{
                                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2" {...props} />,
                                li: ({node, ...props}) => <li className="my-1" {...props} />,
                                p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-2 mt-4" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-200 mb-2 mt-4" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-md font-bold text-gray-300 mb-2 mt-3" {...props} />
                              }}
                            >
                              {remedial.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-800 rounded-lg bg-gray-900/30">
                  <span className="text-3xl mb-3 block opacity-50">✨</span>
                  <p className="text-sm text-gray-400">No targeted reviews yet.</p>
                  <p className="text-xs text-gray-500 mt-1">Keep taking quizzes to identify areas for improvement!</p>
                </div>
              )}
            </div>

            {/* Dashboard Analytics Charts */}
            <DashboardCharts quizHistory={stats?.quizHistory} learningTime={stats?.learningTime} />

          </div>
        </div>
      </div>
    </div>
  );
}