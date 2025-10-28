import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/services/database';

export async function POST() {
  try {
    console.log('🧪 Testing database writes...');

    // Test 1: Track usage
    console.log('Testing usage tracking...');
    await db.trackUsage('twitter', 'write', 1, { test: true });
    await db.trackUsage('twitter', 'read', 1, { test: true });

    // Test 2: Record interaction
    console.log('Testing interaction recording...');
    const testTweetId = `test_${Date.now()}`;
    await db.recordInteraction(
      'twitter',
      testTweetId,
      'post',
      'test_user',
      { test: true, source: 'database_test' }
    );

    // Test 3: Create conversation
    console.log('Testing conversation creation...');
    const conversationId = await db.createConversation(
      'twitter',
      testTweetId,
      'test_user',
      { test: true, source: 'database_test' }
    );

    if (!conversationId) {
      throw new Error('Failed to create conversation');
    }

    // Test 4: Add message
    console.log('Testing message creation...');
    await db.addMessage(
      conversationId,
      'user',
      'This is a test message',
      { test: true }
    );

    await db.addMessage(
      conversationId,
      'assistant',
      'This is a test response',
      { test: true }
    );

    // Test 5: Mark as processed
    console.log('Testing mark as processed...');
    await db.markInteractionProcessed('twitter', testTweetId, conversationId);

    // Verify all writes worked
    console.log('Verifying writes...');
    const todayUsage = await db.getUsageStats('twitter', new Date().toISOString().split('T')[0]);
    const conversation = await db.getConversation(conversationId);
    const messages = await db.getMessages(conversationId);

    return NextResponse.json({
      success: true,
      tests: {
        usageTracking: todayUsage.length > 0,
        interactionRecording: true, // If we got here, it worked
        conversationCreation: !!conversation,
        messageCreation: messages.length === 2,
        markProcessed: true
      },
      data: {
        todayUsage,
        conversation,
        messages: messages.length,
        testTweetId,
        conversationId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database test error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database test endpoint - use POST to run tests',
    timestamp: new Date().toISOString()
  });
}