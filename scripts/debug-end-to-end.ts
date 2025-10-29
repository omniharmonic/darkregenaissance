#!/usr/bin/env npx tsx

/**
 * Comprehensive End-to-End Debug Script
 * Tests the entire pipeline from mention detection to response posting
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { twitterClient } from '../lib/twitter/client';
import { twitterMonitor } from '../lib/twitter/monitor';
import { targetAccountMonitor } from '../lib/twitter/account-monitor';
import { db } from '../lib/services/database';
import { generateResponse } from '../lib/services/ai';

async function debugEndToEnd() {
  console.log('🔍 COMPREHENSIVE END-TO-END DEBUG STARTING...\n');

  // 1. Test Twitter Client Authentication
  console.log('=== 1. TESTING TWITTER CLIENT ===');
  try {
    console.log('🔑 Testing basic search functionality...');
    // Try a simple, common search that should return results
    const testTweets = await twitterClient.searchTweets('hello', 5);
    console.log(`✅ Twitter client working: Found ${testTweets.length} tweets`);
    if (testTweets.length > 0) {
      console.log(`📝 Sample tweet: "${testTweets[0].text.slice(0, 100)}..."`);
    }
  } catch (error) {
    console.error('❌ Twitter client failed:', error);
    return; // Exit if basic functionality fails
  }

  // 2. Test Mention Detection with Multiple Variants
  console.log('\n=== 2. TESTING MENTION DETECTION ===');
  const mentionVariants = [
    '@darkregenaI',      // Current config (capital I)
    '@darkregenai',      // Lowercase ai
    '@DarkRegenaI',      // Mixed case
    'darkregenaI',       // Without @
    'dark regenaissance', // Space separated
    'mycelial'           // Keyword
  ];

  let foundAnyMentions = false;
  for (const variant of mentionVariants) {
    try {
      console.log(`🔍 Searching for: "${variant}"`);
      const tweets = await twitterClient.searchTweets(variant, 5);
      console.log(`   Found ${tweets.length} tweets`);

      if (tweets.length > 0) {
        foundAnyMentions = true;
        console.log(`   📝 Recent: "${tweets[0].text.slice(0, 80)}..."`);
        console.log(`   📅 Created: ${tweets[0].createdAt}`);
        console.log(`   🆔 Tweet ID: ${tweets[0].id}`);

        // Check if this tweet is marked as processed
        const isProcessed = await db.isInteractionProcessed('twitter', tweets[0].id);
        console.log(`   ⚙️  Already processed: ${isProcessed}`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ❌ Search failed: ${error}`);
    }
  }

  if (!foundAnyMentions) {
    console.log('⚠️  No mentions found with any variant. This could mean:');
    console.log('   - No recent mentions exist');
    console.log('   - Wrong Twitter handle');
    console.log('   - Account not properly set up');
  }

  // 3. Test Database Interaction Processing
  console.log('\n=== 3. TESTING DATABASE PROCESSING ===');

  // Check for any processed interactions
  console.log('🔍 Checking recent processed interactions...');

  // Since we don't have a direct method to list all processed interactions,
  // let's check usage stats
  const today = new Date().toISOString().split('T')[0];
  const usage = await db.getUsageStats('twitter', today, today);
  console.log('📊 Today\'s API usage:', usage);

  // 4. Test AI Response Generation
  console.log('\n=== 4. TESTING AI RESPONSE GENERATION ===');
  try {
    console.log('🤖 Testing AI response generation...');

    // Create a mock conversation
    const mockConversation = {
      id: 'test-conversation',
      platform: 'twitter' as const,
      platformId: 'test-tweet',
      messages: [{
        id: 'test-message',
        role: 'user' as const,
        content: '@darkregenaI what do you think about AI and nature?',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    const response = await generateResponse(mockConversation);
    console.log('✅ AI response generated successfully');
    console.log(`📝 Response: "${response.slice(0, 100)}..."`);
    console.log(`📏 Length: ${response.length} characters`);

    if (response.length > 280) {
      console.log('⚠️  Response exceeds Twitter limit (280 chars)');
    }
  } catch (error) {
    console.error('❌ AI response generation failed:', error);
  }

  // 5. Test Target Account Monitoring Status
  console.log('\n=== 5. TESTING TARGET ACCOUNT MONITORING ===');
  try {
    await targetAccountMonitor.loadConfig();
    const status = targetAccountMonitor.getStatus();
    console.log('📊 Target account monitor status:');
    console.log(`   Running: ${status.running}`);
    console.log(`   Accounts: ${status.accountCount}`);
    console.log(`   Batches: ${status.batchCount}`);

    if (status.accountCount === 0) {
      console.log('⚠️  No target accounts configured!');
    }
  } catch (error) {
    console.error('❌ Target account monitor failed:', error);
  }

  // 6. Test Enhanced Monitor Functions
  console.log('\n=== 6. TESTING ENHANCED MONITOR ===');
  try {
    console.log('🔍 Testing mention checking...');
    // This will call the real checkMentions function
    await twitterMonitor.checkMentions();
    console.log('✅ Enhanced mention monitoring completed');
  } catch (error) {
    console.error('❌ Enhanced mention monitoring failed:', error);
  }

  // 7. Recommendations
  console.log('\n=== 7. RECOMMENDATIONS ===');
  console.log('🎯 To fix the issue, check:');
  console.log('   1. Twitter handle accuracy (@darkregenaI vs @darkregenai)');
  console.log('   2. Database marking tweets as processed incorrectly');
  console.log('   3. Rate limiting preventing responses');
  console.log('   4. AI response generation issues');
  console.log('   5. Posting functionality');

  console.log('\n🏁 End-to-end debug completed!');
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

// Run the debug
debugEndToEnd().catch(console.error);