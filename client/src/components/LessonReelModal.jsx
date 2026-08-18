import React, { useState, useEffect, useRef } from "react";
import VideoBlock from "./VideoBlock";
import TextToSpeechButton from "./TextToSpeechButton";
import { useSocket } from "../context/SocketContext";

export default function LessonReelModal({ content, lessonTitle, language, onClose }) {
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const containerRef = useRef(null);
  
  const { socket, roomCode, roomData } = useSocket();
  const isHost = roomData?.hostId === socket?.id;

  useEffect(() => {
    if (!content) return;

    const newSlides = [];

    // 1. Objectives
    if (content.objectives?.length > 0) {
      newSlides.push({
        id: 'objectives',
        type: 'objectives',
        data: content.objectives,
      });
    }

    // 2. Content Blocks
    if (content.content && Array.isArray(content.content)) {
      for (let i = 0; i < content.content.length; i++) {
        const block = content.content[i];
        if (block.type === 'heading') {
          // Since paragraphs are now very large, we put headings on their own slide 
          // or we can let them flow naturally. Let's keep them on their own slide to prevent overflow.
          newSlides.push({ id: `block-${i}`, type: 'heading', data: block.text });
        } else if (block.type === 'paragraph') {
          newSlides.push({ id: `block-${i}`, type: 'paragraph', data: block.text });
        } else if (block.type === 'list') {
          newSlides.push({ id: `block-${i}`, type: 'list', data: block.items });
        } else if (block.type === 'code') {
          newSlides.push({ id: `block-${i}`, type: 'code', data: block.code, language: block.language });
        } else if (block.type === 'video') {
          newSlides.push({ id: `block-${i}`, type: 'video', data: block.query });
        }
      }
    } else if (typeof content === 'string') {
        // Fallback for old string format
        newSlides.push({
            id: 'fallback-string',
            type: 'paragraph',
            data: content
        });
    }

    // 3. Quizzes
    if (content.mcqs && Array.isArray(content.mcqs)) {
      content.mcqs.forEach((mcq, idx) => {
        newSlides.push({
          id: `mcq-${idx}`,
          type: 'mcq',
          data: mcq,
          index: idx + 1
        });
      });
    }

    // 4. End Slide
    newSlides.push({
      id: 'end',
      type: 'end'
    });

    setSlides(newSlides);
  }, [content]);

  useEffect(() => {
    if (!socket) return;
    socket.on("force-sync-slide", ({ slideIndex }) => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: slideIndex * window.innerHeight,
          behavior: 'smooth'
        });
      }
    });
    return () => socket.off("force-sync-slide");
  }, [socket]);

  // Track scroll position to update active indicator
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPosition = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const index = Math.round(scrollPosition / windowHeight);

    // Broadcast if host
    if (isHost && roomCode) {
      socket.emit("sync-reel-slide", { roomCode, slideIndex: index });
    }

    if (index !== currentSlideIndex) {
      setCurrentSlideIndex(index);
    }
  };

  const handleNextSlide = () => {
    if (containerRef.current && currentSlideIndex < slides.length - 1) {
      containerRef.current.scrollTo({
        top: (currentSlideIndex + 1) * window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  // MCQ state for interactivity
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const handleSelectAnswer = (mcqId, option) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [mcqId]: option
    }));
  };

  if (!content) return null;

  // Compute text for TTS
  const currentSlideText = slides[currentSlideIndex]?.type === 'heading_paragraph'
    ? slides[currentSlideIndex]?.heading + ". " + slides[currentSlideIndex]?.paragraph
    : slides[currentSlideIndex]?.data || "";
  const ttsText = Array.isArray(currentSlideText) ? currentSlideText.join(". ") : currentSlideText;

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center overflow-hidden">
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 z-50 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-sm transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* TTS Button */}
      {ttsText && typeof ttsText === 'string' && (
        <div className="absolute top-6 right-12 z-50">
          <TextToSpeechButton text={ttsText} language={language} />
        </div>
      )}

      {/* Progress Dots */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {slides.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlideIndex ? 'bg-emerald-400 h-6' : 'bg-white/30'}`}
          />
        ))}
      </div>

      {/* Main Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {slides.map((slide, idx) => {
          
          return (
            <div 
              key={slide.id} 
              className="w-full h-screen snap-start flex flex-col items-center justify-center p-8 relative"
            >
              {/* Background gradient hint */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-black pointer-events-none" />

              <div className="w-full z-10 animate-fade-in-up">
                
                {slide.type === 'objectives' && (
                  <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-h-[60vh] overflow-y-auto hide-scrollbar">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto sm:mx-0">
                      <span className="text-xl sm:text-2xl">🎯</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center sm:text-left">Learning Objectives</h2>
                    <ul className="space-y-3 sm:space-y-4">
                      {Array.isArray(slide.data) && slide.data.map((obj, i) => (
                        <li key={i} className="flex items-start text-gray-300 text-base sm:text-lg">
                          <span className="text-emerald-400 mr-3 mt-1">✓</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {slide.type === 'heading' && (
                  <div className="text-center px-4 w-full">
                    <h2 className="text-3xl sm:text-4xl font-bold text-emerald-400 leading-tight">{slide.data}</h2>
                  </div>
                )}

                {slide.type === 'paragraph' && (
                  <div className="px-4 w-full max-h-[60vh] overflow-y-auto hide-scrollbar pb-4">
                    <p className="text-base sm:text-xl text-gray-300 leading-relaxed font-light text-center">{slide.data}</p>
                  </div>
                )}

                {slide.type === 'list' && (
                  <div className="px-4 w-full max-h-[60vh] overflow-y-auto hide-scrollbar max-w-lg mx-auto pb-4">
                    <ul className="space-y-4 list-disc list-inside text-gray-300 text-base sm:text-lg text-left">
                      {Array.isArray(slide.data) && slide.data.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {slide.type === 'code' && (
                  <div className="w-full bg-[#0d1117] border border-gray-700 rounded-2xl shadow-2xl max-h-[60vh] flex flex-col">
                    <div className="bg-gray-800 px-4 py-2 flex items-center text-xs text-gray-400 shrink-0 rounded-t-2xl">
                      <div className="flex gap-2 mr-4">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      {slide.language || 'code'}
                    </div>
                    <pre className="p-4 sm:p-6 overflow-auto hide-scrollbar text-emerald-300 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap flex-1 rounded-b-2xl">
                      <code>{slide.data}</code>
                    </pre>
                  </div>
                )}

                {slide.type === 'video' && (
                  <div className="w-full bg-gray-900/80 backdrop-blur-md border border-gray-800 p-6 rounded-3xl shadow-2xl">
                    <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Watch a Video</h3>
                    <p className="text-gray-400 mb-6 text-sm">Suggested search: <span className="text-emerald-400 font-semibold">{slide.data}</span></p>
                    <VideoBlock query={slide.data} />
                  </div>
                )}

                {slide.type === 'mcq' && (
                  <div className="w-full bg-gray-900/80 backdrop-blur-md border border-gray-800 p-6 sm:p-8 rounded-3xl shadow-2xl max-h-[60vh] overflow-y-auto hide-scrollbar">
                    <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6">
                      Quiz {slide.index}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-tight">{slide.data.question}</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {slide.data.options.map((opt, i) => {
                        const isSelected = selectedAnswers[slide.id] === opt;
                        const isCorrect = opt === slide.data.correctAnswer;
                        const hasAnswered = !!selectedAnswers[slide.id];
                        
                        let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium ";
                        
                        if (!hasAnswered) {
                          btnClass += "border-gray-700 bg-gray-800 text-gray-300 hover:border-emerald-500 hover:bg-emerald-900/20";
                        } else {
                          if (isCorrect) {
                            btnClass += "border-emerald-500 bg-emerald-500/20 text-emerald-400";
                          } else if (isSelected && !isCorrect) {
                            btnClass += "border-red-500 bg-red-500/20 text-red-400";
                          } else {
                            btnClass += "border-gray-800 bg-gray-800/50 text-gray-500 opacity-50";
                          }
                        }

                        return (
                          <button 
                            key={i}
                            onClick={() => !hasAnswered && handleSelectAnswer(slide.id, opt)}
                            className={btnClass}
                            disabled={hasAnswered}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    
                    {selectedAnswers[slide.id] && (
                      <div className="mt-6 p-4 rounded-xl bg-gray-800/80 border border-gray-700 animate-fade-in-up">
                        <p className="text-gray-300 text-sm"><strong className="text-white">Explanation:</strong> {slide.data.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {slide.type === 'end' && (
                  <div className="text-center px-4">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                      <span className="text-4xl">🎉</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4">Lesson Complete</h2>
                    <p className="text-gray-400 mb-10">You've reached the end of this lesson.</p>
                    <button 
                      onClick={onClose}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-12 rounded-full transition-all text-lg"
                    >
                      Continue Course
                    </button>
                  </div>
                )}

              </div>

              {/* Swipe Up Indicator (except on last slide) */}
              {idx < slides.length - 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-500 animate-bounce cursor-pointer" onClick={handleNextSlide}>
                  <span className="text-xs tracking-widest uppercase mb-1 font-semibold">Swipe</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx="true">{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
