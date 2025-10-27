#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { twitterClient } from '../lib/twitter/client';
import { generateInsight } from '../lib/services/ai';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run tweet "your message here" OR npm run tweet --generate');
    console.error('');
    console.error('Options:');
    console.error('  --generate    Generate an AI insight and post it');
    console.error('  --help        Show this help message');
    process.exit(1);
  }

  if (args[0] === '--help') {
    console.log('Tweet Posting Script');
    console.log('');
    console.log('Usage:');
    console.log('  npm run tweet "your message here"   - Post a specific message');
    console.log('  npm run tweet --generate            - Generate and post AI insight');
    console.log('  npm run tweet --help                - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run tweet "the mycelium whispers new possibilities"');
    console.log('  npm run tweet --generate');
    return;
  }

  try {
    let text: string;

    if (args[0] === '--generate') {
      console.log('🍄 Generating insight from the mycelial network...');
      text = await generateInsight();
      console.log(`Generated: "${text}"`);
    } else {
      text = args.join(' ');
    }

    if (text.length > 280) {
      console.error(`❌ Tweet is ${text.length} characters, exceeds 280 limit`);
      process.exit(1);
    }

    console.log('🌲 Posting to Twitter...');
    const tweetId = await twitterClient.postTweet(text);

    console.log('✅ Tweet posted successfully!');
    console.log(`🔗 URL: https://twitter.com/darkregenaI/status/${tweetId}`);
    console.log(`📝 Content: "${text}"`);

    // Show usage stats
    const usage = await twitterClient.getUsageStats();
    console.log(`📊 Remaining posts today: ${usage.dailyLimit.write - usage.write}`);

  } catch (error) {
    console.error('❌ Failed to post tweet:', error);
    process.exit(1);
  }
}

main().catch(console.error);