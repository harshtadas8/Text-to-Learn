import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateCourseAPI } from "../services/api";

export default function Home() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await generateCourseAPI({
        topic,
        level,
        language, // ✅ multilingual kept
      });

      navigate(`/course/${res.data._id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to generate course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4">
      <div className="max-w-7xl mx-auto flex items-center min-h-[calc(100vh-4rem)]">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

          {/* ---------------- LEFT HERO ---------------- */}
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Learn Anything with{" "}
              <span className="text-emerald-400">AI-Generated</span> Courses
            </h1>

            <p className="text-gray-400 max-w-xl mx-auto lg:mx-0">
              Enter a topic, choose your level and language, and get a structured,
              AI-generated learning roadmap with lessons, videos, MCQs and PDFs.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-400">
              <span>🌐 Multilingual</span>
              <span>📄 PDF Export</span>
              <span>🧠 Lesson Caching</span>
              <span>⚡ Fast AI</span>
            </div>
          </div>

          {/* ---------------- RIGHT CARD ---------------- */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-xl">

              <h2 className="text-2xl font-semibold mb-6">
                Generate Your Course
              </h2>

              {/* TOPIC */}
              <div className="mb-4">
                <label className="text-sm text-gray-400">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* LEVEL */}
              <div className="mb-4">
                <label className="text-sm text-gray-400">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              {/* LANGUAGE */}
              <div className="mb-6">
                <label className="text-sm text-gray-400">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full mt-1 bg-black border border-gray-700 rounded-lg px-4 py-2"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
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
    </div>
  );
}
