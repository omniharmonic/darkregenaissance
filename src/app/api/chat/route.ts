import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateResponse } from '@/lib/ai/gemini';
import { loadConversation, updateConversation, Message } from '@/lib/storage/conversations';
import { cache } from '@/lib/cache/memory';
import crypto from 'crypto';

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional().nullable()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = ChatRequestSchema.parse(body);

    const finalConversationId = conversationId || crypto.randomUUID();

    // Check cache for similar queries (1 hour TTL)
    const cacheKey = crypto.createHash('md5').update(message).digest('hex');
    const cached = cache.get(cacheKey);

    if (cached) {
      return NextResponse.json({
        response: cached,
        conversationId: finalConversationId,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }

    // Load existing conversation context
    let conversationHistory: Message[] = [];
    if (conversationId) {
      const existingConversation = await loadConversation('web', conversationId);
      if (existingConversation) {
        conversationHistory = existingConversation.messages;
      }
    }

    // Generate AI response
    const { response, tokensUsed } = await generateResponse(message, conversationHistory);

    // Update conversation history
    const newMessages: Message[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        tokens: tokensUsed
      }
    ];

    // Save conversation
    await updateConversation('web', finalConversationId, newMessages);

    // Cache response for similar queries
    cache.set(cacheKey, response, 3600);

    return NextResponse.json({
      response,
      conversationId: finalConversationId,
      timestamp: new Date().toISOString(),
      tokensUsed
    });

  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle specific AI service errors
      if (error.message.includes('budget exceeded') ||
          error.message.includes('quota exceeded') ||
          error.message.includes('mycelium is resting')) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }

      if (error.message.includes('API key not configured')) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Dark Regenaissance Chat API',
    methods: ['POST'],
    version: '1.0.0'
  });
}