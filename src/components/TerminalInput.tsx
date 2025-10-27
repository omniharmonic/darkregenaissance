'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface TerminalInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function TerminalInput({ onSendMessage, disabled }: TerminalInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="flex items-end gap-2 md:gap-3">
      <span className="text-[#00ff41] text-sm md:text-sm shrink-0 mb-1">{'>'}</span>
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "processing..." : "speak your truth..."}
          className="w-full bg-transparent text-[#00ff41] text-sm md:text-sm border-none outline-none placeholder-[#2d5f3f] caret-[#00ff41] resize-none min-h-[20px] max-h-[100px] leading-tight py-1"
          autoFocus
          rows={1}
          style={{
            height: 'auto',
            minHeight: '20px'
          }}
          onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 100) + 'px';
          }}
        />

        {/* Blinking cursor when focused */}
        {input === '' && !disabled && (
          <span className="absolute left-0 top-1 text-[#00ff41] text-sm md:text-sm animate-pulse pointer-events-none">
            |
          </span>
        )}
      </div>

      {input.trim() && !disabled && (
        <button
          onClick={handleSend}
          className="text-[#00ff41] hover:text-[#6bffb8] active:text-[#6bffb8] transition-colors text-sm px-3 py-2 md:px-3 md:py-1 border border-[#00ff41]/30 rounded-md hover:border-[#6bffb8]/50 active:border-[#6bffb8]/50 touch-manipulation bg-[#00ff41]/5 hover:bg-[#6bffb8]/10 active:bg-[#6bffb8]/10 min-h-[32px] flex items-center justify-center"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="md:hidden"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22,2 15,22 11,13 2,9"></polygon>
          </svg>
          <span className="hidden md:inline">send</span>
        </button>
      )}
    </div>
  );
}