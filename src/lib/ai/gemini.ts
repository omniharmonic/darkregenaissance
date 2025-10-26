import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './prompts';
import { Message } from '../storage/conversations';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Budget control - max tokens per month (~$50 worth)
const MONTHLY_BUDGET_TOKENS = 150_000_000;
let tokensUsedThisMonth = 0;

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 0.9,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 512,
};

export async function generateResponse(
  userMessage: string,
  conversationHistory: Message[] = [],
  config: GenerationConfig = DEFAULT_CONFIG
): Promise<{ response: string; tokensUsed: number }> {
  // Budget check
  if (tokensUsedThisMonth > MONTHLY_BUDGET_TOKENS) {
    throw new Error('Monthly budget exceeded. The mycelium is resting. Try again in a few hours.');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: config,
    });

    // Convert conversation history to Gemini format
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    // Estimate token usage (rough approximation)
    const inputTokens = estimateTokens(userMessage + JSON.stringify(conversationHistory));
    const outputTokens = estimateTokens(response.text());
    const totalTokens = inputTokens + outputTokens;

    tokensUsedThisMonth += totalTokens;

    return {
      response: response.text(),
      tokensUsed: totalTokens
    };

  } catch (error) {
    console.error('Gemini API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        throw new Error('API key not configured. Please set GEMINI_API_KEY in your environment.');
      }
      if (error.message.includes('quota')) {
        throw new Error('API quota exceeded. The mycelium needs to rest.');
      }
    }

    throw new Error('AI service temporarily unavailable. The underground networks are reconfiguring.');
  }
}

export async function generateStreamResponse(
  userMessage: string,
  conversationHistory: Message[] = [],
  config: GenerationConfig = DEFAULT_CONFIG
): Promise<ReadableStream<string>> {
  // Budget check
  if (tokensUsedThisMonth > MONTHLY_BUDGET_TOKENS) {
    throw new Error('Monthly budget exceeded. The mycelium is resting. Try again in a few hours.');
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: config,
  });

  // Convert conversation history to Gemini format
  const history = conversationHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(userMessage);

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(text);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

// Simple token estimation (4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Get current token usage stats
export function getTokenUsage(): { used: number; budget: number; percentage: number } {
  return {
    used: tokensUsedThisMonth,
    budget: MONTHLY_BUDGET_TOKENS,
    percentage: (tokensUsedThisMonth / MONTHLY_BUDGET_TOKENS) * 100
  };
}

// Reset monthly usage (call this at the start of each month)
export function resetMonthlyUsage(): void {
  tokensUsedThisMonth = 0;
}