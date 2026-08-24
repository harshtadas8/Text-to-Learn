import React, { useState } from 'react';

export default function DiagnosticQuizModal({ isOpen, questions, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !questions || questions.length === 0) return null;

  const handleOptionChange = (qIndex, option) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    // Grade the answers locally
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });

    let level = "Beginner";
    if (score === 2) level = "Intermediate";
    if (score === 3) level = "Advanced";

    setSubmitted(true);
    // Allow user a moment to see it's done before callback
    setTimeout(() => {
      onSubmit(level);
    }, 500);
  };

  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">Diagnostic Quiz</h2>
            <p className="text-gray-400 mt-1">Let's find out your starting level.</p>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="p-4 bg-black rounded-xl border border-gray-800">
              <p className="font-semibold text-lg text-white mb-4">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oIndex) => (
                  <label 
                    key={oIndex} 
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${answers[qIndex] === opt ? 'bg-emerald-900/30 border-emerald-500' : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'}`}
                  >
                    <input 
                      type="radio"
                      name={`question-${qIndex}`}
                      value={opt}
                      checked={answers[qIndex] === opt}
                      onChange={() => handleOptionChange(qIndex, opt)}
                      className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500"
                    />
                    <span className="ml-3 text-gray-300">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-2 rounded-lg font-semibold bg-gray-800 hover:bg-gray-700 transition"
          >
            Skip (Beginner)
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={!allAnswered || submitted}
            className="px-6 py-2 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-black transition disabled:opacity-50"
          >
            {submitted ? "Grading..." : "Submit & Generate Course"}
          </button>
        </div>

      </div>
    </div>
  );
}