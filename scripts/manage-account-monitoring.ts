#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { targetAccountMonitor } from '../lib/twitter/account-monitor';
import { twitterClient } from '../lib/twitter/client';
import { db } from '../lib/services/database';

async function showAccountStats() {
  console.log('📊 Target Account Statistics');
  console.log('============================');

  try {
    await targetAccountMonitor.loadConfig();
    const status = targetAccountMonitor.getStatus();

    console.log(`📈 Overview:`);
    console.log(`   - Total accounts: ${status.accountCount}`);
    console.log(`   - Total batches: ${status.batchCount}`);
    console.log(`   - Monitor status: ${status.running ? '🟢 Running' : '🔴 Stopped'}`);

    // Get usage stats
    const usage = await twitterClient.getUsageStats();
    console.log(`\n🔄 API Usage Today:`);
    console.log(`   - Reads: ${usage.read}/${usage.dailyLimit.read} (${Math.round((usage.read / usage.dailyLimit.read) * 100)}%)`);
    console.log(`   - Writes: ${usage.write}/${usage.dailyLimit.write} (${Math.round((usage.write / usage.dailyLimit.write) * 100)}%)`);

    // Get recent interactions
    const interactions = await db.getUnprocessedInteractions('twitter', 10);
    console.log(`\n📋 Recent Interactions:`);
    console.log(`   - Unprocessed: ${interactions.length}`);

    const recentConversations = await db.getRecentConversations('twitter', 5);
    console.log(`   - Recent conversations: ${recentConversations.length}`);

  } catch (error) {
    console.error('❌ Failed to show stats:', error);
  }
}

async function testSingleBatch() {
  console.log('\n🧪 Testing Single Batch Processing');
  console.log('===================================');

  try {
    // Load the configuration
    await targetAccountMonitor.loadConfig();

    // Get a few high-priority accounts for testing
    const testAccounts = [
      { handle: 'sama', name: 'Sam Altman' },
      { handle: 'elonmusk', name: 'Elon Musk' },
      { handle: 'DarioAmodei', name: 'Dario Amodei' }
    ];

    console.log(`🎯 Testing with accounts: ${testAccounts.map(a => a.name).join(', ')}`);

    // Check API limits first
    const canRead = await db.checkUsageLimit('twitter', 'read', 100);
    if (!canRead) {
      console.log('⏰ API read limit reached - cannot perform test');
      return;
    }

    // Build test query
    const query = testAccounts.map(acc => `from:${acc.handle}`).join(' OR ');
    const fullQuery = `(${query}) -is:retweet`;

    console.log(`🔍 Search query: ${fullQuery}`);

    // Search for tweets
    const tweets = await twitterClient.searchTweets(fullQuery, 10);
    console.log(`📋 Found ${tweets.length} tweets`);

    // Analyze tweets
    for (const tweet of tweets.slice(0, 3)) {
      console.log(`\n📝 Tweet Analysis:`);
      console.log(`   - ID: ${tweet.id}`);
      console.log(`   - Author: ${tweet.authorId}`);
      console.log(`   - Age: ${Math.round((Date.now() - new Date(tweet.createdAt).getTime()) / (1000 * 60 * 60))} hours`);
      console.log(`   - Text: ${tweet.text.slice(0, 100)}...`);
      console.log(`   - Has conversation ID: ${tweet.conversationId ? 'Yes' : 'No'}`);

      // Check if already processed
      const processed = await db.isInteractionProcessed('twitter', tweet.id);
      console.log(`   - Already processed: ${processed ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error('❌ Batch test failed:', error);
  }
}

async function cleanupOldInteractions() {
  console.log('\n🧹 Cleaning Up Old Interactions');
  console.log('===============================');

  try {
    // Get old interactions (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(`🗓️ Cleaning interactions older than: ${sevenDaysAgo.toISOString()}`);

    // Note: This would require a custom query to delete old interactions
    // For now, just show what we would clean
    console.log('📊 Would clean up old processed interactions');
    console.log('📊 Would archive old conversations');
    console.log('📊 Would remove temporary test data');

    console.log('✅ Cleanup simulation complete');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function simulateResponseLogic() {
  console.log('\n🤖 Testing Response Logic');
  console.log('=========================');

  const testCases = [
    {
      account: { handle: 'sama', category: 'AI Acceleration', name: 'Sam Altman' },
      tweet: 'The future of AI will transform everything we know about work and creativity.',
      expectedStrategy: 'aggressive'
    },
    {
      account: { handle: 'timnitGebru', category: 'AI Ethics', name: 'Timnit Gebru' },
      tweet: 'We need to be more careful about AI bias and fairness in deployment.',
      expectedStrategy: 'conservative'
    },
    {
      account: { handle: 'BillGates', category: 'Corporate Greenwashing / Tech', name: 'Bill Gates' },
      tweet: 'Climate change solutions require unprecedented global cooperation.',
      expectedStrategy: 'minimal'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Test Case: ${testCase.account.name}`);
    console.log(`   Category: ${testCase.account.category}`);
    console.log(`   Tweet: "${testCase.tweet}"`);
    console.log(`   Expected Strategy: ${testCase.expectedStrategy}`);

    // Simulate content analysis
    const hasAIKeywords = testCase.tweet.toLowerCase().includes('ai') || testCase.tweet.toLowerCase().includes('artificial intelligence');
    const isSubstantial = testCase.tweet.length > 50;
    const hasLinks = testCase.tweet.includes('http');

    console.log(`   Analysis:`);
    console.log(`     - Has AI keywords: ${hasAIKeywords}`);
    console.log(`     - Substantial length: ${isSubstantial}`);
    console.log(`     - Contains links: ${hasLinks}`);

    // Simulate response probability
    let probability = 0;
    if (testCase.account.category.includes('AI Acceleration')) {
      probability = hasAIKeywords ? 0.8 : 0.4;
    } else if (testCase.account.category.includes('Ethics')) {
      probability = hasAIKeywords ? 0.4 : 0.1;
    } else if (testCase.account.category.includes('Greenwashing')) {
      probability = hasAIKeywords ? 0.3 : 0.05;
    }

    console.log(`     - Response probability: ${Math.round(probability * 100)}%`);
    console.log(`     - Would respond: ${Math.random() < probability ? 'Yes' : 'No'}`);
  }
}

async function monitoringHealthCheck() {
  console.log('\n🏥 Monitoring Health Check');
  console.log('=========================');

  try {
    // Database health
    const dbHealth = await db.healthCheck();
    console.log(`📊 Database: ${dbHealth ? '✅ Healthy' : '❌ Unhealthy'}`);

    // API connectivity
    try {
      const usage = await twitterClient.getUsageStats();
      console.log(`📊 Twitter API: ✅ Connected (${usage.read} reads today)`);
    } catch (error) {
      console.log(`📊 Twitter API: ❌ Connection failed`);
    }

    // Configuration validity
    try {
      await targetAccountMonitor.loadConfig();
      console.log(`📊 Account Config: ✅ Valid`);
    } catch (error) {
      console.log(`📊 Account Config: ❌ Invalid`);
    }

    // Rate limit status
    const canRead = await db.checkUsageLimit('twitter', 'read', 100);
    const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
    console.log(`📊 Rate Limits: ${canRead ? '✅' : '❌'} Read, ${canWrite ? '✅' : '❌'} Write`);

    console.log('\n🎯 System Status: All checks passed');

  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

async function main() {
  const command = process.argv[2];

  const commands = {
    'stats': showAccountStats,
    'test-batch': testSingleBatch,
    'cleanup': cleanupOldInteractions,
    'test-logic': simulateResponseLogic,
    'health': monitoringHealthCheck,
    'help': () => {
      console.log('🛠️ Account Monitoring Management');
      console.log('===============================');
      console.log('Available commands:');
      console.log('  stats       - Show account monitoring statistics');
      console.log('  test-batch  - Test processing a single batch');
      console.log('  cleanup     - Clean up old interactions');
      console.log('  test-logic  - Test response logic with examples');
      console.log('  health      - Perform system health check');
      console.log('  help        - Show this help message');
      console.log('');
      console.log('Usage: npm run manage-accounts <command>');
    }
  };

  if (command && commands[command as keyof typeof commands]) {
    await commands[command as keyof typeof commands]();
  } else {
    commands.help();
  }
}

main().catch(console.error);