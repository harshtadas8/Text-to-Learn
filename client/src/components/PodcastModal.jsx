import React, { useState, useEffect, useRef } from 'react';

export default function PodcastModal({ isOpen, onClose, lessonTitle, courseTitle, content, language }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [progress, setProgress] = useState(0);

  const utteranceRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
    return () => {
      stopAudio();
    };
  }, [isOpen]);

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const getFullText = () => {
    if (!content) return "";
    const blocks = [];
    if (content.objectives?.length > 0) {
      blocks.push({ type: "objectives_container", items: content.objectives });
    }
    if (content.content?.length > 0) {
      blocks.push(...content.content);
    }
    const fullText = blocks
      .filter(b => b.type === "objectives_container" || b.type === "heading" || b.type === "paragraph" || b.type === "list")
      .map(b => {
        if (b.type === "objectives_container") return "Learning Objectives: " + (Array.isArray(b.items) ? b.items.join(". ") : String(b.items || ""));
        if (b.type === "list") return Array.isArray(b.items) ? b.items.join(". ") : String(b.items || "");
        return String(b.text || "");
      })
      .join(". ");
    
    return fullText.replace(/[#*`_]/g, '');
  };

  const handlePlayPause = () => {
    if (!isSupported) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      startFakeProgress();
    } else {
      startAudio();
    }
  };

  const startAudio = () => {
    const textToSpeak = getFullText();
    if (!textToSpeak) return;

    window.speechSynthesis.cancel();
    setProgress(0);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let preferredVoice = null;
    
    const lowerLang = (language || '').toLowerCase();
    
    if (lowerLang.includes('marathi')) {
      preferredVoice = voices.find(v => v.lang.toLowerCase().includes('mr-in') || v.lang.toLowerCase().includes('mr') || v.name.toLowerCase().includes('marathi'));
    } else if (lowerLang.includes('hindi')) {
      preferredVoice = voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'));
    } else if (lowerLang.includes('hinglish')) {
      preferredVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
    }
    
    if (!preferredVoice) {
      preferredVoice = voices.find(v => v.lang.toLowerCase().includes('en') && v.name.includes('Google')) || voices.find(v => v.lang.toLowerCase().includes('en'));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    const wordCount = textToSpeak.split(' ').length;
    const estimatedSeconds = Math.max(10, wordCount / 2.5);

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsPlaying(false);
      setIsPaused(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
    
    startFakeProgress(estimatedSeconds);
  };

  const startFakeProgress = (estimatedSeconds) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const totalTime = estimatedSeconds ? estimatedSeconds * 1000 : 300000; 
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          clearInterval(intervalRef.current);
          return 99;
        }
        return prev + (100 / (totalTime / 100));
      });
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className={`absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-black transition-opacity duration-1000 ${isPlaying && !isPaused ? 'opacity-100' : 'opacity-30'}`} />
      
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-gray-400 hover:text-white bg-gray-900/50 hover:bg-gray-800 p-3 rounded-full transition z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative w-full max-w-md flex flex-col items-center text-center z-10">
        <div className="relative mb-12">
          {isPlaying && !isPaused && (
            <>
              <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 scale-150" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 scale-125" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}></div>
            </>
          )}
          <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isPlaying && !isPaused ? 'bg-gradient-to-br from-emerald-600 to-blue-600 shadow-emerald-500/50 scale-105' : 'bg-gray-800 border border-gray-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-20 h-20 ${isPlaying && !isPaused ? 'text-white' : 'text-gray-500'}`}>
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
              <path d="M15.932 7.757a.75.75 0 011.061 0 4.5 4.5 0 010 6.364.75.75 0 01-1.06-1.06 3 3 0 000-4.243.75.75 0 010-1.061z" />
            </svg>
          </div>
        </div>

        <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs mb-2">
          {courseTitle || "Podcast Mode"}
        </p>
        <h2 className="text-3xl font-bold text-white mb-8 px-4 leading-tight">
          {lessonTitle || "Untitled Lesson"}
        </h2>

        <div className="w-full px-8 mb-10">
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
                    <button 
            onClick={() => { 
              stopAudio(); 
              setTimeout(() => startAudio(), 100); 
            }}
            disabled={!isPlaying}
            className="p-3 text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
          
          <button 
            onClick={handlePlayPause}
            className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {isPlaying && !isPaused ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 ml-1">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={stopAudio}
            disabled={!isPlaying}
            className="p-3 text-gray-400 hover:text-red-400 disabled:opacity-30 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
          </button>
        </div>

        {!isSupported && (
          <p className="mt-8 text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg">
            Your browser does not support Text-to-Speech.
          </p>
        )}
      </div>
    </div>
  );
}