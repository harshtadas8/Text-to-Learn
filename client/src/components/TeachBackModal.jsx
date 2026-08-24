import React, { useState, useRef, useEffect } from "react";
import { evaluateTeachBackAPI } from "../services/api";
  

export default function TeachBackModal({ isOpen, onClose, courseId, moduleIndex, lessonIndex, language }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const finalTextRef = useRef("");

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setTranscript("");
    finalTextRef.current = "";
      setFeedback(null);
      setError(null);
      setIsEvaluating(false);
    }
  }, [isOpen]);

  const startRecording = () => {
    setError(null);
    setTranscript("");
    setFeedback(null);
    
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Set language if applicable
    if (language === "Hindi") recognition.lang = "hi-IN";
    else if (language === "Marathi") recognition.lang = "mr-IN";
    else recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      setError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    
    try {
      setIsEvaluating(true);
      setError(null);
      const res = await evaluateTeachBackAPI({
        courseId,
        moduleIndex,
        lessonIndex,
        language,
        transcript
      });
      
      if (res.success) {
        setFeedback(res.data);
      } else {
        setError(res.message || "Failed to evaluate.");
      }
    } catch (err) {
      console.error("Teachback evaluation error:", err);
      setError("An error occurred while evaluating your explanation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <span className="text-2xl">🎙️</span> Teach-Back Mode
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Explain the concept out loud to solidify your understanding. Our AI will evaluate you!
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-3xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recording Area */}
          {!feedback && !isEvaluating && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-2 border-emerald-500/50 flex items-center justify-center transition-all hover:scale-105 text-4xl"
                >
                  🎙️
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full bg-red-500/20 text-red-400 border-2 border-red-500/50 flex items-center justify-center animate-pulse text-4xl"
                >
                  ⏹️
                </button>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-200">
                  {isRecording ? "Recording your explanation..." : "Tap the mic and start explaining"}
                </h3>
              </div>

              {/* Live Transcript Box */}
              <div className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 min-h-[120px] relative">
                {transcript ? (
                  <p className="text-gray-300 whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <p className="text-gray-600 italic text-center absolute inset-0 flex items-center justify-center">
                    Your transcription will appear here...
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/50 p-3 rounded-lg w-full">
                  <span>⚠️</span> {error}
                </div>
              )}

              {transcript && !isRecording && (
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl font-bold text-white hover:opacity-90 transition"
                >
                  Submit for Evaluation
                </button>
              )}
            </div>
          )}

          {/* Evaluating State */}
          {isEvaluating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-200">Analyzing your explanation</h3>
                <p className="text-gray-400 mt-2">Checking against the lesson content...</p>
              </div>
            </div>
          )}

          {/* Feedback State */}
          {feedback && !isEvaluating && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
                <span className="text-lg font-medium text-gray-300">Your Score</span>
                <div className="flex items-center gap-2">
                  <span className={`text-4xl font-bold ${feedback.score >= 80 ? 'text-emerald-400' : feedback.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {feedback.score}
                  </span>
                  <span className="text-gray-500 font-bold">/ 100</span>
                </div>
              </div>

              {feedback.whatWasGood?.length > 0 && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4">
                  <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-3">
                    <span>✅</span> What You Got Right
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                    {feedback.whatWasGood.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.whatWasMissed?.length > 0 && (
                <div className="bg-yellow-950/30 border border-yellow-900/50 rounded-xl p-4">
                  <h4 className="text-yellow-400 font-bold flex items-center gap-2 mb-3">
                    <span>⚠️</span> What You Missed
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                    {feedback.whatWasMissed.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.whatWasWrong?.length > 0 && (
                <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4">
                  <h4 className="text-red-400 font-bold flex items-center gap-2 mb-3">
                    <span>❌</span> Misconceptions
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                    {feedback.whatWasWrong.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-white transition"
              >
                Close & Continue Learning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
