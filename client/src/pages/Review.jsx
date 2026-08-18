import { useEffect, useState } from "react";
import { getDueCardsAPI, reviewCardAPI } from "../services/api";
import { useAuth0 } from "@auth0/auth0-react";
import confetti from "canvas-confetti";

export default function Review() {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the current card being answered
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDueCards();
  }, [isAuthenticated]);

  const fetchDueCards = async () => {
    try {
      setLoading(true);
      const res = await getDueCardsAPI(user.sub);
      if (res.success) {
        setCards(res.data);
      } else {
        setError("Failed to load your review queue.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching your reviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = async (option) => {
    if (isAnswered || submitting) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    setSubmitting(true);

    const currentCard = cards[currentIndex];
    const isCorrect = option === currentCard.correctAnswer;
    
    // Quality mapping for SM-2: 
    // 4 = correct (good response)
    // 1 = incorrect (wrong response, but remembered slightly)
    const quality = isCorrect ? 4 : 1;

    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#10b981", "#34d399"]
      });
    }

    try {
      await reviewCardAPI({ cardId: currentCard._id, quality });
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please log in to access Daily Review</h2>
          <button 
            onClick={() => loginWithRedirect()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-xl text-gray-400 animate-pulse">Loading your due reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-2">You're all caught up!</h1>
        <p className="text-gray-400 max-w-md text-center">
          You've completed all your spaced repetition flashcards for today. Check back tomorrow to keep your memory sharp!
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 md:p-12 font-sans flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-3xl flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Daily Review
          </h1>
          <p className="text-gray-400 text-sm mt-1">Spaced Repetition System (SRS)</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {cards.length - currentIndex} cards due
        </div>
      </div>

      {/* Flashcard */}
      <div className="w-full max-w-3xl bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 md:p-10 shadow-xl">
        <div className="mb-6">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-800 bg-gray-900 px-3 py-1.5 rounded-md">
            {currentCard.courseTopic}
          </span>
        </div>
        
        <h2 className="text-lg md:text-2xl font-medium leading-relaxed mb-8 text-gray-100">
          {currentCard.question}
        </h2>

        <div className="space-y-3">
          {currentCard.options.map((opt, idx) => {
            
            let btnClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 text-sm md:text-base ";
            
            if (!isAnswered) {
              btnClass += "border-gray-800 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800 cursor-pointer text-gray-300";
            } else {
              if (opt === currentCard.correctAnswer) {
                // Correct answer is always highlighted green
                btnClass += "border-emerald-500 bg-emerald-900/20 text-emerald-300";
              } else if (opt === selectedOption) {
                // Wrong selected answer highlighted red
                btnClass += "border-red-500 bg-red-900/20 text-red-300";
              } else {
                // Other options muted
                btnClass += "border-gray-800 bg-gray-900 text-gray-600 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered || submitting}
                onClick={() => handleOptionClick(opt)}
                className={btnClass}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation and Next Button */}
        {isAnswered && (
          <div className="mt-8 pt-6 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h4 className="text-emerald-400 font-semibold mb-2">Explanation</h4>
            <p className="text-gray-300 leading-relaxed mb-6">
              {currentCard.explanation}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={handleNext}
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
              >
                Next Question ➔
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
