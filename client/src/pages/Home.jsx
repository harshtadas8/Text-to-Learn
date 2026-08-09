import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateCourseAPI } from "../services/api";
import { useAuth0 } from "@auth0/auth0-react";

export default function Home() {
  const navigate = useNavigate();

  const { isAuthenticated, loginWithRedirect } = useAuth0();

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [language, setLanguage] = useState("English");
  const [goal, setGoal] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("2-5 hours/week");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadingMessages = [
    "Analyzing your goals...",
    "Structuring a personalized learning roadmap...",
    "Writing detailed lessons...",
    "Finding the best video resources...",
    "Finalizing your AI course..."
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {

    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    
    if (!goal.trim()) {
      setError("Please tell us your learning goal");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await generateCourseAPI({
        topic,
        level,
        language,
        goal,
        timeAvailable,
      });

      navigate(`/course/${res.data._id}`);
    } 
    catch (err) {
      console.error("Full Error:", err);
      
      // If Auth0 silent token fetch fails (e.g., due to new scopes or expired session)
      const errorStr = err?.message?.toLowerCase() || err?.error?.toLowerCase() || "";
      if (errorStr.includes('login required') || errorStr.includes('login_required') || errorStr.includes('consent required') || errorStr.includes('consent_required')) {
        loginWithRedirect();
        return;
      }

      setError("Something went wrong. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4">
      <div className="max-w-7xl mx-auto flex items-center min-h-[calc(100vh-4rem)]">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full my-8">

          {/* ---------------- LEFT HERO ---------------- */}
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Learn Anything with{" "}
              <span className="text-emerald-400">Personalized</span> AI Courses
            </h1>

            <p className="text-gray-400 max-w-xl mx-auto lg:mx-0">
              Tell us what you want to learn, your goals, and your time constraints. Our AI builds a customized learning roadmap with lessons, videos, and quizzes just for you.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-400">
              <span>🎯 Goal-Oriented</span>
              <span>⏳ Time-Aware</span>
              <span>🧠 Smart Quizzes</span>
              <span>⚡ Fast AI</span>
            </div>
          </div>

          {/* ---------------- RIGHT CARD ---------------- */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-xl">

              <h2 className="text-2xl font-semibold mb-2">
                Generate Your Roadmap
              </h2>

              <p className={`text-xs mb-6 flex items-center gap-2 ${isAuthenticated ? 'text-emerald-400' : 'text-gray-400'}`}>
                {isAuthenticated 
                  ? "✅ Ready to generate" 
                  : "🔐 Login required to generate"}
              </p>

              {/* TOPIC */}
              <div className="mb-4">
                <label className="text-sm text-gray-400">What do you want to learn?</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, Machine Learning"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* GOAL */}
              <div className="mb-4">
                <label className="text-sm text-gray-400">What is your goal?</label>
                <input
                  type="text"
                  placeholder="e.g. Build a SaaS, Get a job, Ace my exam"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* LEVEL & TIME (ROW) */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400">Experience</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Time Available</label>
                  <select
                    value={timeAvailable}
                    onChange={(e) => setTimeAvailable(e.target.value)}
                    className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option>&lt; 2 hours/week</option>
                    <option>2-5 hours/week</option>
                    <option>5-10 hours/week</option>
                    <option>10+ hours/week</option>
                  </select>
                </div>
              </div>

              {/* LANGUAGE */}
              <div className="mb-6">
                <label className="text-sm text-gray-400">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Hinglish</option>
                </select>
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-3">{error}</p>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-400 to-blue-500 hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Course 🚀"}
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* ---------------- LOADING OVERLAY ---------------- */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-8"></div>
          <h2 className="text-2xl font-bold text-emerald-400 animate-pulse text-center px-4">
            {loadingMessages[loadingMsgIdx]}
          </h2>
          <p className="mt-4 text-gray-400 max-w-sm text-center px-4">
            This might take 10-15 seconds as our AI generates a complete course specifically tailored for you.
          </p>
        </div>
      )}
    </div>
  );
}