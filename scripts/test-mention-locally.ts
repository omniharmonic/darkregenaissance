#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { twitterClient } from '../lib/twitter/client';
import { generateResponse } from '../lib/services/ai';
import { db } from '../lib/services/database';

async function testMentionHandling() {
  console.log('🧪 Local Mention Testing Mode');
  console.log('==============================');
  console.log('⚠️  TEST MODE: No actual tweets will be posted\n');

  try {
    // Check for mentions (just like the real monitor)
    console.log('🔍 Checking for mentions of @darkregenaI...');

    const tweets = await twitterClient.searchTweets('@darkregenaI', 10);
    console.log(`📋 Found ${tweets.length} recent mentions\n`);

    if (tweets.length === 0) {
      console.log('ℹ️  No recent mentions found. The mention might be:');
      console.log('   - Too old (>24 hours)');
      console.log('   - Using different spelling (@darkregenai vs @darkregenaI)');
      console.log('   - Not yet indexed by Twitter search');
      return;
    }

    // Process each mention
    for (let i = 0; i < Math.min(tweets.length, 3); i++) {
      const tweet = tweets[i];
      console.log(`\n🎯 Processing Mention ${i + 1}:`);
      console.log(`   Tweet ID: ${tweet.id}`);
      console.log(`   Author: ${tweet.authorId}`);
      console.log(`   Created: ${tweet.createdAt}`);
      console.log(`   Text: "${tweet.text}"`);

      // Check if already processed
      const alreadyProcessed = await db.isInteractionProcessed('twitter', tweet.id);
      console.log(`   Already processed: ${alreadyProcessed ? '✅ Yes' : '❌ No'}`);

      if (alreadyProcessed) {
        console.log('   ⏭️  Skipping (already handled)');
        continue;
      }

      // Get thread context (the new feature!)
      console.log('\n🧵 Getting Thread Context...');
      try {
        const threadContext = await twitterClient.getThreadContext(tweet.id, 10);

        console.log(`   📊 Thread Analysis:`);
        console.log(`      - Thread length: ${threadContext.threadTweets.length} tweets`);
        console.log(`      - Has conversation ID: ${threadContext.currentTweet.conversationId ? 'Yes' : 'No'}`);
        console.log(`      - Context length: ${threadContext.totalContext.length} characters`);

        if (threadContext.threadTweets.length > 1) {
          console.log(`\n   🔍 Full Thread Context:`);
          console.log(`   ${threadContext.totalContext.slice(0, 400)}...`);
        }

        // Create conversation context for AI
        const conversation = {
          id: `test_${tweet.id}`,
          platform: 'twitter' as const,
          platformId: tweet.id,
          messages: [{
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: threadContext.threadTweets.length > 1
              ? `Thread context:\n${threadContext.totalContext}\n\nI was mentioned in the last tweet. Please respond appropriately to the conversation.`
              : tweet.text,
            timestamp: new Date().toISOString()
          }],
          createdAt: new Date().toISOString()
        };

        // Generate AI response (the enhanced part!)
        console.log('\n🤖 Generating AI Response...');
        const response = await generateResponse(conversation);

        console.log(`\n✨ Generated Response:`);
        console.log(`   "${response}"`);
        console.log(`   Character count: ${response.length}/280`);

        if (response.length > 280) {
          console.log(`   ⚠️  Response too long! Would be truncated.`);
        }

        console.log(`\n📝 What would happen in production:`);
        console.log(`   1. ✅ Create conversation in database`);
        console.log(`   2. ✅ Add thread context to conversation`);
        console.log(`   3. ✅ Generate contextual AI response`);
        console.log(`   4. 🚀 Post reply: "${response.slice(0, 50)}..."`);
        console.log(`   5. ✅ Mark interaction as processed`);
        console.log(`   6. 📊 Track API usage`);

      } catch (threadError) {
        console.error(`   ❌ Thread context error:`, threadError);
        console.log(`   ℹ️  Fallback: Would use original tweet text only`);
      }
    }

    // Show API usage
    const usage = await twitterClient.getUsageStats();
    console.log(`\n📊 API Usage After Test:`);
    console.log(`   - Reads: ${usage.read}/${usage.dailyLimit.read}`);
    console.log(`   - Writes: ${usage.write}/${usage.dailyLimit.write}`);
    console.log(`   - Remaining capacity: ${usage.dailyLimit.read - usage.read} reads, ${usage.dailyLimit.write - usage.write} writes`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testTargetAccountMonitoring() {
  console.log('\n\n🎯 Testing Target Account Monitoring');
  console.log('====================================');
  console.log('⚠️  TEST MODE: No actual tweets will be posted\n');

  try {
    // Test with a few high-priority accounts
    const testAccounts = ['sama', 'elonmusk', 'DarioAmodei'];
    console.log(`🔍 Testing with accounts: ${testAccounts.join(', ')}`);

    const query = testAccounts.map(handle => `from:${handle}`).join(' OR ');
    const fullQuery = `(${query}) -is:retweet`;

    console.log(`🔎 Search query: ${fullQuery}`);

    const tweets = await twitterClient.searchTweets(fullQuery, 20);
    console.log(`📋 Found ${tweets.length} recent tweets from target accounts\n`);

    // Analyze a few tweets
    for (let i = 0; i < Math.min(tweets.length, 2); i++) {
      const tweet = tweets[i];

      console.log(`📝 Tweet ${i + 1} Analysis:`);
      console.log(`   Author: ${tweet.authorId}`);
      console.log(`   Age: ${Math.round((Date.now() - new Date(tweet.createdAt).getTime()) / (1000 * 60 * 60))} hours`);
      console.log(`   Text: "${tweet.text.slice(0, 100)}..."`);
      console.log(`   Length: ${tweet.text.length} characters`);

      // Simulate filtering logic
      const hasAIKeywords = /\b(ai|artificial intelligence|machine learning|neural|llm|technology|innovation|future)\b/i.test(tweet.text);
      const isRecent = (Date.now() - new Date(tweet.createdAt).getTime()) < 24 * 60 * 60 * 1000;
      const isSubstantial = tweet.text.length > 50;

      console.log(`   Filtering Results:`);
      console.log(`     - Has AI/tech keywords: ${hasAIKeywords ? '✅' : '❌'}`);
      console.log(`     - Recent (< 24h): ${isRecent ? '✅' : '❌'}`);
      console.log(`     - Substantial length: ${isSubstantial ? '✅' : '❌'}`);

      const shouldRespond = hasAIKeywords && isRecent && isSubstantial;
      console.log(`     - 🎲 Would respond: ${shouldRespond ? '✅ YES' : '❌ NO'}`);

      if (shouldRespond) {
        console.log(`   📝 Would generate contextual response for this high-value tweet`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Target account test failed:', error);
  }
}

async function main() {
  console.log('🚀 Enhanced Twitter Monitoring - Local Test');
  console.log('===========================================\n');

  await testMentionHandling();
  await testTargetAccountMonitoring();

  console.log('\n🎉 Local testing complete!');
  console.log('\nℹ️  To run in production mode:');
  console.log('   npm run monitor');
}

main().catch(console.error);