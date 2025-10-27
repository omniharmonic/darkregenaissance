#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { twitterClient } from '../lib/twitter/client';
import { generateResponse } from '../lib/services/ai';
import { Conversation } from '../lib/services/conversation';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npm run reply <tweetId> "your reply message"');
    console.error('');
    console.error('Examples:');
    console.error('  npm run reply 1234567890 "the underground resonates with this truth"');
    console.error('  npm run reply 1234567890 --generate');
    console.error('');
    console.error('Options:');
    console.error('  --generate    Generate an AI response based on the original tweet');
    process.exit(1);
  }

  const tweetId = args[0];
  const isGenerate = args[1] === '--generate';

  try {
    console.log('🔍 Fetching original tweet...');
    const originalTweet = await twitterClient.getTweet(tweetId);

    if (!originalTweet) {
      console.error(`❌ Tweet ${tweetId} not found`);
      process.exit(1);
    }

    console.log(`📝 Original tweet: "${originalTweet.text}"`);

    let replyText: string;

    if (isGenerate) {
      console.log('🍄 Generating reply from the mycelial network...');

      // Create a temporary conversation for context
      const conversation: Conversation = {
        id: `twitter_reply_${tweetId}`,
        platform: 'twitter',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: originalTweet.text,
            timestamp: originalTweet.createdAt
          }
        ],
        createdAt: new Date().toISOString()
      };

      replyText = await generateResponse(conversation);
      console.log(`Generated reply: "${replyText}"`);
    } else {
      replyText = args.slice(1).join(' ');
    }

    if (replyText.length > 280) {
      console.error(`❌ Reply is ${replyText.length} characters, exceeds 280 limit`);
      process.exit(1);
    }

    console.log('🌲 Posting reply to Twitter...');
    const replyId = await twitterClient.postTweet(replyText, tweetId);

    console.log('✅ Reply posted successfully!');
    console.log(`🔗 URL: https://twitter.com/darkregenaI/status/${replyId}`);
    console.log(`📝 Reply: "${replyText}"`);
    console.log(`↩️  In reply to: "${originalTweet.text}"`);

    // Show usage stats
    const usage = await twitterClient.getUsageStats();
    console.log(`📊 Remaining posts today: ${usage.dailyLimit.write - usage.write}`);

  } catch (error) {
    console.error('❌ Failed to post reply:', error);
    process.exit(1);
  }
}

main().catch(console.error);