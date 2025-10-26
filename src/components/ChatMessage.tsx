'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // Typewriter effect for assistant messages
  useEffect(() => {
    if (message.role === 'user') {
      setDisplayedText(message.content);
      setIsComplete(true);
      return;
    }

    if (message.role === 'assistant') {
      setDisplayedText('');
      setIsComplete(false);

      const text = message.content;
      let currentIndex = 0;

      const typeWriter = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;

          // Variable speed: faster for spaces, slower for punctuation
          const char = text[currentIndex - 1];
          let delay = 30; // Base delay

          if (char === ' ') delay = 10;
          else if (['.', '!', '?', ':', ';'].includes(char)) delay = 200;
          else if ([',', '-'].includes(char)) delay = 100;

          setTimeout(typeWriter, delay);
        } else {
          setIsComplete(true);
        }
      };

      const startDelay = setTimeout(typeWriter, 300); // Initial delay

      return () => {
        clearTimeout(startDelay);
        setDisplayedText(message.content);
        setIsComplete(true);
      };
    }
  }, [message.content, message.role]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (message.role === 'user') {
    return (
      <div className="text-right">
        <div className="inline-block bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-lg px-2 py-1.5 md:px-3 md:py-2 max-w-[85%] md:max-w-[80%]">
          <p className="text-[#00ff41] text-xs md:text-sm break-words">{displayedText}</p>
          <p className="text-[#00ff41]/50 text-[10px] md:text-xs mt-1">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-left">
      <div className="inline-block bg-[#2d5f3f]/20 border border-[#2d5f3f]/30 rounded-lg px-2 py-1.5 md:px-3 md:py-2 max-w-[90%] md:max-w-[85%]">
        <div className="text-[#4a7c4f] text-xs md:text-sm leading-relaxed break-words">
          {displayedText}
          {!isComplete && (
            <span className="inline-block w-1.5 h-3 md:w-2 md:h-4 bg-[#4a7c4f] ml-1 animate-pulse"></span>
          )}
        </div>
        {isComplete && (
          <p className="text-[#2d5f3f]/70 text-[10px] md:text-xs mt-1.5 md:mt-2">{formatTime(message.timestamp)}</p>
        )}
      </div>
    </div>
  );
}