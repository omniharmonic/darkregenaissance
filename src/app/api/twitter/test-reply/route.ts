import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '../../../../../lib/twitter/client';
import { db } from '../../../../../lib/services/database';
import { generateResponse } from '../../../../../lib/services/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.confirm) {
      return NextResponse.json({
        error: 'Manual confirmation required',
        instructions: 'Add {"confirm": true, "tweetId": "123...", "message": "test message"} to request body',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!body.tweetId || !body.message) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['tweetId', 'message'],
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log(`🧪 Manual Twitter reply test to tweet ${body.tweetId}`);

    // Check database connection
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      return NextResponse.json({
        error: 'Database not healthy',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Check rate limits
    const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
    if (!canWrite) {
      return NextResponse.json({
        error: 'Twitter write limit reached for today',
        timestamp: new Date().toISOString()
      }, { status: 429 });
    }

    // Check if we've already processed this tweet
    const alreadyProcessed = await db.isInteractionProcessed('twitter', body.tweetId);

    // Create conversation in database
    const conversationId = await db.createConversation(
      'twitter',
      body.tweetId,
      body.authorId || 'test_user',
      {
        tweetText: body.message,
        source: 'manual_test',
        testMode: true
      }
    );

    if (!conversationId) {
      throw new Error('Failed to create conversation in database');
    }

    // Add user message to conversation
    await db.addMessage(conversationId, 'user', body.message, {
      tweetId: body.tweetId,
      authorId: body.authorId || 'test_user',
      testMode: true
    });

    // Generate AI response
    const conversation = {
      id: conversationId,
      platform: 'twitter' as const,
      platformId: body.tweetId,
      messages: [{
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: body.message,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    const response = await generateResponse(conversation);
    await db.trackUsage('gemini', 'generate', 1);

    // Post reply with TEST prefix
    const replyId = await twitterClient.postTweet(`🧪 TEST REPLY: ${response}`, body.tweetId);
    await db.trackUsage('twitter', 'write', 1);

    console.log(`✅ Posted test reply: ${replyId}`);

    // Add assistant message to conversation
    await db.addMessage(conversationId, 'assistant', response, {
      replyTweetId: replyId,
      testMode: true
    });

    // Record interaction as processed
    await db.recordInteraction(
      'twitter',
      body.tweetId,
      'reply',
      body.authorId || 'test_user',
      {
        originalText: body.message,
        response: response,
        testMode: true,
        source: 'test_endpoint'
      }
    );

    await db.markInteractionProcessed('twitter', body.tweetId, conversationId);

    return NextResponse.json({
      success: true,
      replyId,
      conversationId,
      response,
      alreadyProcessed,
      database: 'healthy',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Twitter reply test error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready_for_testing',
    instructions: {
      description: 'Test Twitter reply functionality',
      method: 'POST',
      body: {
        confirm: true,
        tweetId: 'tweet_id_to_reply_to',
        message: 'original tweet content',
        authorId: 'optional_author_id'
      }
    },
    timestamp: new Date().toISOString()
  });
}