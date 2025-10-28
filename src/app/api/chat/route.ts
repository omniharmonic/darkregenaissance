import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateResponse } from '@/lib/ai/gemini';
import { db } from '../../../../lib/services/database';
import { cache } from '@/lib/cache/memory';
import crypto from 'crypto';

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional().nullable()
});

// Helper function to get or create web conversation
async function getOrCreateWebConversation(conversationId: string): Promise<string> {
  // If no conversationId provided, create new one
  if (!conversationId) {
    const newId = await db.createConversation('web', undefined, undefined, {
      source: 'web_chat',
      userAgent: 'web'
    });
    return newId || crypto.randomUUID();
  }

  // Check if conversation exists in database
  const existing = await db.getConversation(conversationId);
  if (existing) {
    return conversationId;
  }

  // Create new conversation with provided ID
  const created = await db.createConversation('web', undefined, undefined, {
    source: 'web_chat',
    userAgent: 'web',
    providedId: conversationId
  });

  return created || conversationId;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = ChatRequestSchema.parse(body);

    const finalConversationId = await getOrCreateWebConversation(conversationId || crypto.randomUUID());

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

    // Load existing conversation context from database
    let conversationHistory: any[] = [];
    if (conversationId) {
      const dbMessages = await db.getMessages(finalConversationId, 20); // Get up to 20 recent messages
      conversationHistory = dbMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        tokens: msg.metadata?.tokens
      }));
    }

    // Generate AI response
    const { response, tokensUsed } = await generateResponse(message, conversationHistory);
    await db.trackUsage('gemini', 'generate', 1);

    // Add user message to database
    await db.addMessage(finalConversationId, 'user', message, {
      timestamp: new Date().toISOString(),
      source: 'web_chat'
    });

    // Add assistant response to database
    await db.addMessage(finalConversationId, 'assistant', response, {
      timestamp: new Date().toISOString(),
      tokens: tokensUsed,
      source: 'web_chat'
    });

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