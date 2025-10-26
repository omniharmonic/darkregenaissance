'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface TerminalInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function TerminalInput({ onSendMessage, disabled }: TerminalInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[#00ff41] text-xs md:text-sm shrink-0">{'>'}</span>
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "processing..." : "speak your truth..."}
          className="w-full bg-transparent text-[#00ff41] text-xs md:text-sm border-none outline-none placeholder-[#2d5f3f] caret-[#00ff41]"
          autoFocus
        />

        {/* Blinking cursor when focused */}
        {input === '' && !disabled && (
          <span className="absolute left-0 top-0 text-[#00ff41] text-xs md:text-sm animate-pulse pointer-events-none">
            |
          </span>
        )}
      </div>

      {input.trim() && !disabled && (
        <button
          onClick={handleSend}
          className="text-[#00ff41] hover:text-[#6bffb8] active:text-[#6bffb8] transition-colors text-xs px-2 py-1 md:px-3 md:py-1 border border-[#00ff41]/30 rounded hover:border-[#6bffb8]/50 active:border-[#6bffb8]/50 touch-manipulation"
        >
          send
        </button>
      )}
    </div>
  );
}