import React, { useState, useEffect } from 'react';

export default function TextToSpeechButton({ text, language }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const togglePlay = () => {
    if (!isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Clean text to avoid reading markdown weirdly
      const cleanText = typeof text === 'string' ? text.replace(/[#*`_]/g, '') : '';
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Attempt to pick a good voice based on language
      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      let preferredVoice = null;
      
      const lowerLang = (language || '').toLowerCase();
      
      if (lowerLang.includes('marathi')) {
        preferredVoice = voices.find(v => v.lang.toLowerCase().includes('mr-in') || v.lang.toLowerCase().includes('mr') || v.name.toLowerCase().includes('marathi'));
      } else if (lowerLang.includes('hindi')) {
        preferredVoice = voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'));
      } else if (lowerLang.includes('hinglish')) {
        // For Hinglish (Latin characters), Indian English (en-IN) works much better than Hindi (hi-IN)
        preferredVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
      }
      
      if (!preferredVoice) {
        // Default to English Google Voice or generic English
        preferredVoice = voices.find(v => v.lang.toLowerCase().includes('en') && v.name.includes('Google')) || voices.find(v => v.lang.toLowerCase().includes('en'));
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  if (!isSupported) return null;

  return (
    <button
      onClick={togglePlay}
      className={`p-2 rounded-full flex items-center justify-center transition ${
        isPlaying ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
      }`}
      title="Listen to content"
    >
      {isPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white shadow-sm">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      )}
    </button>
  );
}
