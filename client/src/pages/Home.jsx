import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateCourseAPI, generateDiagnosticQuizAPI, uploadMaterialAPI } from "../services/api";
import { useAuth0 } from "@auth0/auth0-react";
import DiagnosticQuizModal from "../components/DiagnosticQuizModal";

export default function Home() {
  const navigate = useNavigate();

  const { isAuthenticated, loginWithRedirect } = useAuth0();

  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState(() => {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("hi")) return "Hindi";
    if (lang.startsWith("mr")) return "Marathi";
    return "English"; // Default fallback
  });
  const [goal, setGoal] = useState("");
  const [file, setFile] = useState(null);
  const [sourceMaterial, setSourceMaterial] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("2-5 hours/week");
  const [loading, setLoading] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [error, setError] = useState("");
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);

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
    if (loading || isGeneratingQuiz) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading, isGeneratingQuiz]);

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
      setIsGeneratingQuiz(true);
      setError("");

      let extractedText = "";
      if (file) {
        const uploadRes = await uploadMaterialAPI(file);
        extractedText = uploadRes.text;
        setSourceMaterial(extractedText);
      }

      const res = await generateDiagnosticQuizAPI({ topic, language, sourceMaterial: extractedText });
      if (res && res.questions) {
        setQuizQuestions(res.questions);
        setShowQuiz(true);
      } else {
        // Fallback
        handleQuizSubmit("Beginner", extractedText);
      }
    } 
    catch (err) {
      console.error("Quiz Error:", err);
      // Skip quiz on error and default to Beginner
      handleQuizSubmit("Beginner", sourceMaterial);
    }
    finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizSubmit = async (level, text = sourceMaterial) => {
    setShowQuiz(false);
    try {
      setLoading(true);
      setError("");

      const res = await generateCourseAPI({
        topic,
        level,
        language,
        goal,
        timeAvailable,
        sourceMaterial: text
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

      // Check if the backend sent a specific error message (like a 429 rate limit)
      const backendMessage = err?.response?.data?.message;
      setError(backendMessage || "Something went wrong. Please try again.");
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

              {/* UPLOAD MATERIAL (OPTIONAL) */}
              <div className="mb-4">
                <label className="text-sm text-gray-400">Source Material (Optional PDF/TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full mt-1 bg-black border border-gray-700 text-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-900/30 file:text-emerald-400 hover:file:bg-emerald-900/50"
                />
                {file && <p className="text-xs text-emerald-400 mt-2">Attached: {file.name}</p>}
              </div>

              {/* TIME AVAILABLE */}
              <div className="mb-4">
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

              {/* LANGUAGE TOGGLES */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
                  🌐 Choose Your Learning Language
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["English", "Hindi", "Marathi", "Hinglish"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                        language === lang 
                          ? "bg-emerald-500 text-black border border-emerald-500" 
                          : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-200"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
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

      <DiagnosticQuizModal 
        isOpen={showQuiz}
        questions={quizQuestions}
        onSubmit={handleQuizSubmit}
        onCancel={() => handleQuizSubmit("Beginner")}
      />

      {/* ---------------- LOADING OVERLAY ---------------- */}
      {(loading || isGeneratingQuiz) && (
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
