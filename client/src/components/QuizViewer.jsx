import { useState, useEffect } from "react";
import { generateQuizAPI, addXpAPI, submitQuizAPI, harvestFlashcardsAPI } from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useAuth0 } from "@auth0/auth0-react";

export default function QuizViewer({ courseTopic, moduleTitle, lessonTitle, lessonContent, initialQuizData = null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizData, setQuizData] = useState(initialQuizData);
  const [quizScores, setQuizScores] = useState(null);
  const [teams, setTeams] = useState(null);
  const [quizStreaks, setQuizStreaks] = useState(null);
  const [battleRecap, setBattleRecap] = useState(null);
  
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

    socket.on("quiz-battle-started", ({ quizScores, teams }) => {
      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setBattleRecap(null);
      setQuizScores(quizScores);
      setTeams(teams);
      setQuizStreaks({});
    });

    socket.on("quiz-scores-updated", ({ quizScores, quizStreaks }) => {
      setQuizScores(quizScores);
      if (quizStreaks) setQuizStreaks(quizStreaks);
    });

    socket.on("quiz-battle-finished", (recap) => {
      setBattleRecap(recap);
    });

    return () => {
      socket.off("receive-quiz");
      socket.off("quiz-battle-started");
      socket.off("quiz-scores-updated");
      socket.off("quiz-battle-finished");
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
          socket.emit("start-quiz-battle", { roomCode, totalQuestions: res.data.questions.length });
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
      const correctOpt = q.correctAnswer || q.answer;
      if (answers[idx] === correctOpt) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    if (isMultiplayer) {
      // Send all results to backend in one batch
      const results = quizData.questions.map((q, idx) => {
        const correctOpt = q.correctAnswer || q.answer;
        return { isCorrect: answers[idx] === correctOpt };
      });

      socket.emit("submit-quiz-answers", {
        roomCode,
        userId: user.sub,
        results
      });
    }
    
    // Background memory analysis
    try {
      const mappedAnswers = quizData.questions.map((q, idx) => {
        const correctOpt = q.correctAnswer || q.answer;
        return {
          question: q.question,
          userAnswer: answers[idx],
          correctAnswer: correctOpt,
          isCorrect: answers[idx] === correctOpt
        };
      });

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
        {Array.isArray(quizData?.questions) && quizData.questions.map((q, idx) => {
          const correctOpt = q.correctAnswer || q.answer;
          return (
          <div key={idx} className="pb-6 border-b border-gray-800/50 last:border-0 last:pb-0">
            <p className="font-semibold text-sm sm:text-base mb-4 leading-relaxed">{idx + 1}. {q.question}</p>
            <div className="space-y-2">
              {Array.isArray(q.options) && q.options.map((opt, i) => {
                const isSelected = answers[idx] === opt;
                let optionStyle = "border-gray-700 hover:border-gray-500 bg-gray-900 text-gray-300";
                
                if (submitted) {
                  if (opt === correctOpt) {
                    optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                  } else if (isSelected && opt !== correctOpt) {
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
              <div className={`mt-4 p-4 rounded-lg text-base ${answers[idx] === correctOpt ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                <p className="font-semibold mb-1">
                  {answers[idx] === correctOpt ? '✅ Correct!' : '❌ Incorrect'}
                </p>
                <p>{q.explanation}</p>
              </div>
            )}
          </div>
        )})}
      </div>

      {!submitted && !battleRecap ? (
        <button
          onClick={handleSubmit}
          className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition shadow-lg shadow-emerald-500/20"
        >
          Submit Answers
        </button>
      ) : (
        <div className="mt-8 text-center p-6 bg-black border border-gray-800 rounded-lg">
          {battleRecap ? (
            <div className="animate-in zoom-in duration-300">
              <h4 className="text-3xl font-black mb-4 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                {battleRecap.winningTeam === "Tie" ? "It's a Tie!" : `${battleRecap.winningTeam} Wins!`}
              </h4>
              <p className="text-gray-300 text-lg mb-6">
                Team A: <span className="font-bold text-blue-400">{battleRecap.teamAScore}</span> | 
                Team B: <span className="font-bold text-red-400">{battleRecap.teamBScore}</span>
              </p>
              {battleRecap.mvp && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl max-w-sm mx-auto">
                  <p className="text-yellow-400 font-bold uppercase text-sm mb-1">MVP</p>
                  <p className="text-xl font-bold text-white">{battleRecap.mvp.name}</p>
                </div>
              )}
              {battleRecap.questionStats && (
                <div className="mb-6 max-w-md mx-auto text-left space-y-2">
                  <h5 className="font-bold text-gray-300 text-sm uppercase tracking-wide border-b border-gray-700 pb-1 mb-2">Question Breakdown</h5>
                  {Object.entries(battleRecap.questionStats).map(([qIdx, stats]) => (
                    <div key={qIdx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Q{parseInt(qIdx) + 1}</span>
                      <div className="flex gap-4">
                        <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> {stats.correct}</span>
                        <span className="text-red-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> {stats.wrong}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <h4 className="text-2xl font-bold mb-2">
                You scored {score} out of {quizData.questions.length}!
              </h4>
              <p className="text-gray-400 mb-4">
                {isMultiplayer ? "Waiting for other players to finish..." : "Review the explanations above to learn from your mistakes."}
              </p>
              {score === quizData.questions.length && (
                <div className="mb-6 inline-block bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-4 py-2 rounded-full font-bold animate-bounce">
                  🌟 +50 XP Awarded!
                </div>
              )}
            </>
          )}

          <button
            onClick={() => {
              setQuizData(null);
              setAnswers({});
              setSubmitted(false);
              setScore(0);
              setBattleRecap(null);
              
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
          <h3 className="text-xl font-bold mb-4 text-white">🏆 Teams</h3>
          
          <div className="space-y-6">
            {["Team A", "Team B"].map(teamName => {
              const teamMembers = roomData?.users?.filter(u => teams?.[u.id] === teamName) || [];
              if (teamMembers.length === 0) return null;
              
              return (
                <div key={teamName} className="space-y-2">
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${teamName === "Team A" ? "text-blue-400" : "text-red-400"}`}>
                    {teamName}
                  </h4>
                  {teamMembers.sort((a, b) => (quizScores[b.id] || 0) - (quizScores[a.id] || 0)).map((u, i) => (
                    <div key={u.id} className="flex items-center justify-between bg-black p-3 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate max-w-[100px] text-gray-200">{u.name}</span>
                        {quizStreaks?.[u.id] > 1 && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1" title="Streak!">
                            🔥 {quizStreaks[u.id]}
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-400 font-bold">{quizScores[u.id] || 0}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
