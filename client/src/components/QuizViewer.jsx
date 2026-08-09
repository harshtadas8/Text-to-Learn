import { useState } from "react";
import { generateQuizAPI, addXpAPI } from "../services/api";

export default function QuizViewer({ courseTopic, moduleTitle, lessonTitle, lessonContent }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizData, setQuizData] = useState(null);
  
  // user answers mapping: index -> selected option string
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

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
    <div className="mt-8 p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-xl">
      <h3 className="text-2xl font-bold mb-6 text-emerald-400">Lesson Quiz</h3>
      
      <div className="space-y-8">
        {quizData.questions.map((q, idx) => (
          <div key={idx} className="bg-black p-5 rounded-lg border border-gray-800">
            <p className="font-semibold text-base mb-4">{idx + 1}. {q.question}</p>
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
                    className={`w-full text-left p-3 rounded-lg border transition text-base ${optionStyle}`}
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
            }}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Try Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}
