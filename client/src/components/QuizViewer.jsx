import { useState, useEffect } from "react";
import { generateQuizAPI, addXpAPI, submitQuizAPI, harvestFlashcardsAPI } from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useAuth0 } from "@auth0/auth0-react";

export default function QuizViewer({ courseTopic, moduleTitle, lessonTitle, lessonContent, initialQuizData = null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizData, setQuizData] = useState(initialQuizData);
  const [quizScores, setQuizScores] = useState(null);
  
  // user answers mapping: index -> selected option string
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const { socket, roomCode, roomData } = useSocket() || {};
  const { user } = useAuth0();
  const isHost = roomData?.hostId === socket?.id;
  const isMultiplayer = !!roomCode;

  // React to new initialQuizData (like when global overlay passes a new quiz)
  useEffect(() => {
    if (initialQuizData) {
      setQuizData(initialQuizData);
    }
  }, [initialQuizData]);

  // Listen for multiplayer quiz events
  useEffect(() => {
    if (!socket || !isMultiplayer) return;

    socket.on("receive-quiz", (data) => {
      // Handle both formats just in case
      setQuizData(data.quizData || data);
    });

    socket.on("quiz-battle-started", (scores) => {
      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setQuizScores(scores);
    });

    socket.on("quiz-scores-updated", (scores) => {
      setQuizScores(scores);
    });

    return () => {
      socket.off("receive-quiz");
      socket.off("quiz-battle-started");
      socket.off("quiz-scores-updated");
    };
  }, [socket, isMultiplayer]);

  const handleGenerateQuiz = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await generateQuizAPI({
        courseTopic,
        moduleTitle,
        lessonTitle,
        lessonContent
      });

      if (res.data && res.data.questions) {
        setQuizData(res.data);
        
        if (isMultiplayer && isHost) {
          socket.emit("sync-quiz", { 
            roomCode, 
            quizData: res.data,
            meta: { courseTopic, moduleTitle, lessonTitle }
          });
          socket.emit("start-quiz-battle", { roomCode });
        }

        // Silently harvest these questions for the Spaced Repetition System!
        try {
          // ensure fields match Flashcard model expectations
          const mcqs = res.data.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer || q.answer, // Fix the property name here
            explanation: q.explanation
          }));
          await harvestFlashcardsAPI({ courseTopic, mcqs });
        } catch (harvestErr) {
          console.error("Silent SRS harvesting failed:", harvestErr);
        }

      } else {
        throw new Error("Invalid quiz data format");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex, option) => {
    if (submitted) return;
    setAnswers({
      ...answers,
      [qIndex]: option
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quizData.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    let correctCount = 0;
    quizData.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    if (isMultiplayer) {
      // For each correct answer, we add to score on backend
      quizData.questions.forEach((q, idx) => {
        socket.emit("submit-quiz-answer", {
          roomCode,
          userId: user.sub,
          isCorrect: answers[idx] === q.correctAnswer
        });
      });
    }
    
    // Background memory analysis
    try {
      // Map user answers cleanly
      const mappedAnswers = quizData.questions.map((q, idx) => ({
        question: q.question,
        userAnswer: answers[idx],
        correctAnswer: q.correctAnswer,
        isCorrect: answers[idx] === q.correctAnswer
      }));

      submitQuizAPI({
        courseTopic,
        quizQuestions: quizData.questions,
        userAnswers: mappedAnswers
      }); // Not awaiting, let it run in background
    } catch (err) {
      console.error("Failed to trigger memory analysis:", err);
    }

    if (correctCount === quizData.questions.length) {
      try {
        await addXpAPI(50);
      } catch (err) {
        console.error("Failed to award XP:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-gray-900 border border-gray-800 rounded-xl text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">AI is reading the lesson and generating your quiz...</p>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="mt-8 p-6 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl text-center shadow-lg">
        <h3 className="text-xl font-bold mb-2">Test Your Knowledge</h3>
        <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
          Our AI can generate a personalized 3-question quiz based specifically on what you just read.
        </p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          onClick={handleGenerateQuiz}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition"
        >
          Generate Quiz 🧠
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className={`${isMultiplayer && quizScores ? "lg:col-span-3" : "lg:col-span-4"} p-4 sm:p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-xl`}>
        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-emerald-400">
          {isMultiplayer ? "⚔️ Multiplayer Quiz Battle" : "Lesson Quiz"}
        </h3>
      
      <div className="space-y-6">
        {quizData.questions.map((q, idx) => (
          <div key={idx} className="pb-6 border-b border-gray-800/50 last:border-0 last:pb-0">
            <p className="font-semibold text-sm sm:text-base mb-4 leading-relaxed">{idx + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = answers[idx] === opt;
                let optionStyle = "border-gray-700 hover:border-gray-500 bg-gray-900 text-gray-300";
                
                if (submitted) {
                  if (opt === q.correctAnswer) {
                    optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                  } else if (isSelected && opt !== q.correctAnswer) {
                    optionStyle = "border-red-500 bg-red-500/10 text-red-400";
                  } else {
                    optionStyle = "border-gray-800 bg-gray-900/50 opacity-50";
                  }
                } else if (isSelected) {
                  optionStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-400";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(idx, opt)}
                    disabled={submitted}
                    className={`w-full text-left p-3 rounded-lg border transition text-sm sm:text-base ${optionStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            
            {submitted && (
              <div className={`mt-4 p-4 rounded-lg text-base ${answers[idx] === q.correctAnswer ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                <p className="font-semibold mb-1">
                  {answers[idx] === q.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                </p>
                <p>{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition shadow-lg shadow-emerald-500/20"
        >
          Submit Answers
        </button>
      ) : (
        <div className="mt-8 text-center p-6 bg-black border border-gray-800 rounded-lg">
          <h4 className="text-2xl font-bold mb-2">
            You scored {score} out of {quizData.questions.length}!
          </h4>
          <p className="text-gray-400 mb-4">
            {score === quizData.questions.length 
              ? "Perfect! You've mastered this lesson." 
              : "Review the explanations above to learn from your mistakes."}
          </p>
          {score === quizData.questions.length && (
            <div className="mb-6 inline-block bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-4 py-2 rounded-full font-bold animate-bounce">
              🌟 +50 XP Awarded!
            </div>
          )}
          <button
            onClick={() => {
              setQuizData(null);
              setAnswers({});
              setSubmitted(false);
              setScore(0);
              
              if (isMultiplayer && isHost) {
                socket.emit("close-global-quiz", { roomCode });
              }
            }}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Try Another Quiz
          </button>
        </div>
      )}
      </div>

      {isMultiplayer && quizScores && (
        <div className="lg:col-span-1 p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-xl h-fit">
          <h3 className="text-xl font-bold mb-4 text-white">🏆 Leaderboard</h3>
          <div className="space-y-4">
            {roomData?.users?.sort((a, b) => (quizScores[b.id] || 0) - (quizScores[a.id] || 0)).map((u, i) => (
              <div key={u.id} className="flex items-center justify-between bg-black p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-bold w-4">{i + 1}.</span>
                  <span className="font-semibold text-sm truncate max-w-[100px]">{u.name}</span>
                </div>
                <span className="text-emerald-400 font-bold">{quizScores[u.id] || 0} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
