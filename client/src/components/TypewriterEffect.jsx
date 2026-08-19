import React, { useState, useEffect } from 'react';

export default function TypewriterEffect({ text, speed = 10, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);
    
    const safeText = String(text || '');
    
    if (!safeText) {
      setIsTyping(false);
      if (onComplete) onComplete();
      return;
    }

    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + safeText.charAt(i));
      i++;
      
      if (i >= safeText.length) {
        clearInterval(intervalId);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {isTyping && <span className="animate-pulse font-light text-emerald-400">|</span>}
    </span>
  );
}
