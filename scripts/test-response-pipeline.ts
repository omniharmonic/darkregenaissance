#!/usr/bin/env npx tsx

/**
 * Test Response Pipeline Without Rate Limits
 * Simulates the response generation and posting pipeline
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../lib/services/database';
import { generateResponse } from '../lib/services/ai';
import { twitterClient } from '../lib/twitter/client';

async function testResponsePipeline() {
  console.log('🧪 TESTING RESPONSE PIPELINE (BYPASSING RATE LIMITS)...\n');

  // 1. Create Mock Tweet Data (Simulating a mention)
  console.log('=== 1. CREATING MOCK TWEET DATA ===');

  const mockTweet = {
    id: `test-tweet-${Date.now()}`, // Unique ID to avoid conflicts
    text: '@darkregenaI what is your perspective on regenerative AI systems that work in harmony with nature?',
    createdAt: new Date().toISOString(),
    authorId: 'test-user-123',
    conversationId: `conversation-${Date.now()}`
  };

  console.log('📝 Mock tweet created:');
  console.log(`   ID: ${mockTweet.id}`);
  console.log(`   Text: "${mockTweet.text}"`);
  console.log(`   Author: ${mockTweet.authorId}`);

  // 2. Test Database Interaction Processing Check
  console.log('\n=== 2. TESTING DATABASE PROCESSING CHECK ===');

  try {
    const isAlreadyProcessed = await db.isInteractionProcessed('twitter', mockTweet.id);
    console.log(`✅ Database check successful: Already processed = ${isAlreadyProcessed}`);

    if (isAlreadyProcessed) {
      console.log('⚠️  Mock tweet already marked as processed (this is unexpected)');
    } else {
      console.log('✅ Mock tweet not processed yet (expected behavior)');
    }
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return;
  }

  // 3. Test Conversation Creation
  console.log('\n=== 3. TESTING CONVERSATION CREATION ===');

  let conversationId;
  try {
    conversationId = await db.createConversation(
      'twitter',
      mockTweet.id,
      mockTweet.authorId,
      {
        tweetText: mockTweet.text,
        tweetCreatedAt: mockTweet.createdAt,
        source: 'test_pipeline'
      }
    );

    console.log(`✅ Conversation created: ID = ${conversationId}`);
  } catch (error) {
    console.error('❌ Conversation creation failed:', error);
    return;
  }

  // 4. Test Message Addition
  console.log('\n=== 4. TESTING MESSAGE ADDITION ===');

  try {
    await db.addMessage(conversationId, 'user', mockTweet.text, {
      tweetId: mockTweet.id,
      authorId: mockTweet.authorId
    });

    console.log('✅ User message added to conversation');
  } catch (error) {
    console.error('❌ Message addition failed:', error);
    return;
  }

  // 5. Test AI Response Generation
  console.log('\n=== 5. TESTING AI RESPONSE GENERATION ===');

  try {
    // Create conversation object for AI generation
    const conversation = {
      id: conversationId,
      platform: 'twitter' as const,
      platformId: mockTweet.id,
      messages: [{
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: mockTweet.text,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    const response = await generateResponse(conversation);
    console.log('✅ AI response generated successfully');
    console.log(`📝 Response: "${response}"`);
    console.log(`📏 Length: ${response.length} characters`);

    if (response.length > 280) {
      console.log('⚠️  Response exceeds Twitter limit, will be truncated');
      response = response.slice(0, 270) + '...';
    }

    // 6. Test Tweet Posting (DISABLED FOR SAFETY)
    console.log('\n=== 6. TESTING TWEET POSTING (SIMULATION) ===');

    console.log('🛡️  SAFETY: Tweet posting disabled in test mode');
    console.log('📝 Would post reply:');
    console.log(`   Text: "${response}"`);
    console.log(`   Reply to: ${mockTweet.id}`);

    // Simulate successful post
    const mockReplyId = `reply-${Date.now()}`;
    console.log(`✅ Simulated successful post: ${mockReplyId}`);

    // 7. Test Conversation Update
    console.log('\n=== 7. TESTING CONVERSATION UPDATE ===');

    try {
      await db.addMessage(conversationId, 'assistant', response, {
        replyTweetId: mockReplyId
      });

      console.log('✅ Assistant message added to conversation');
    } catch (error) {
      console.error('❌ Assistant message addition failed:', error);
    }

    // 8. Test Interaction Marking
    console.log('\n=== 8. TESTING INTERACTION MARKING ===');

    try {
      await db.markInteractionProcessed('twitter', mockTweet.id, conversationId);
      console.log('✅ Interaction marked as processed');

      // Verify it's now marked as processed
      const nowProcessed = await db.isInteractionProcessed('twitter', mockTweet.id);
      console.log(`✅ Verification: Now processed = ${nowProcessed}`);
    } catch (error) {
      console.error('❌ Interaction marking failed:', error);
    }

  } catch (error) {
    console.error('❌ AI response generation failed:', error);
    return;
  }

  // 9. Summary
  console.log('\n=== 9. PIPELINE TEST SUMMARY ===');
  console.log('✅ Full response pipeline test completed successfully!');
  console.log('🎯 Pipeline stages:');
  console.log('   1. ✅ Database processing check');
  console.log('   2. ✅ Conversation creation');
  console.log('   3. ✅ Message addition');
  console.log('   4. ✅ AI response generation');
  console.log('   5. 🛡️  Tweet posting (simulated)');
  console.log('   6. ✅ Conversation update');
  console.log('   7. ✅ Interaction marking');

  console.log('\n🔧 NEXT STEPS:');
  console.log('   1. Enable actual tweet posting');
  console.log('   2. Fix mention detection issue');
  console.log('   3. Ensure tweets are not pre-marked as processed');
  console.log('   4. Test with real Twitter data');
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

// Run the test
testResponsePipeline().catch(console.error);