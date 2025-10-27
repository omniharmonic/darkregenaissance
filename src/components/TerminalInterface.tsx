'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { TerminalInput } from './TerminalInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function TerminalInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error instanceof Error
          ? error.message
          : 'connection lost to the mycelial network...',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end md:items-center justify-center z-20 pointer-events-none p-0 md:p-4">
      <div className="w-full h-full md:w-[720px] md:h-[480px] md:max-w-[90vw] md:max-h-[80vh] pointer-events-auto">
        <div className="bg-black/90 md:bg-black/85 backdrop-blur-md border-0 md:border border-[#00ff41]/40 rounded-none md:rounded-lg h-full flex flex-col font-mono shadow-2xl shadow-[#00ff41]/20">
          {/* Terminal header */}
          <div className="border-b border-[#00ff41]/30 p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
              <span className="text-[#00ff41] text-xs md:text-sm ml-2 md:ml-4">
                dark.regenaissance:~$
              </span>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 pb-safe">
            {messages.length === 0 && (
              <div className="text-[#2d5f3f] text-sm md:text-sm px-1">
                <p className="animate-pulse">the mycelium is listening...</p>
                <p className="mt-2 text-xs md:text-sm opacity-60">
                  speak your truth into the darkness
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="text-[#2d5f3f] text-xs md:text-sm animate-pulse">
                <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 bg-[#4a7c4f] rounded-full animate-bounce mr-1"></span>
                <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 bg-[#4a7c4f] rounded-full animate-bounce mr-1" style={{ animationDelay: '0.1s' }}></span>
                <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 bg-[#4a7c4f] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-[#00ff41]/30 p-3 md:p-4 pb-safe bg-black/50 md:bg-transparent">
            <TerminalInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}