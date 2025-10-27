import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '../../../../../lib/twitter/client';
import { generateResponse } from '../../../../../lib/services/ai';
import { type Conversation } from '../../../../../lib/services/conversation';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking for mentions...');

    let processedMentions = 0;
    const errors: string[] = [];

    // Search for mentions
    const mentionKeywords = ['@darkregenaI', 'dark regenaissance', 'mycelial'];

    for (const keyword of mentionKeywords) {
      try {
        const tweets = await twitterClient.searchTweets(keyword, 5);

        for (const tweet of tweets) {
          try {
            // Simple check - if tweet contains bot mentions, respond
            if (shouldRespondToTweet(tweet.text)) {
              await respondToTweet(tweet);
              processedMentions++;

              // Rate limit: max 2 responses per cron run
              if (processedMentions >= 2) {
                console.log('🛑 Rate limit reached for this cycle');
                break;
              }
            }
          } catch (error) {
            console.error(`Error processing tweet ${tweet.id}:`, error);
            errors.push(`Tweet ${tweet.id}: ${error}`);
          }
        }

        if (processedMentions >= 2) break;

      } catch (error) {
        console.error(`Error searching for keyword "${keyword}":`, error);
        errors.push(`Search "${keyword}": ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      processedMentions,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in mention monitor:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function shouldRespondToTweet(text: string): boolean {
  const lowerText = text.toLowerCase();
  const triggers = [
    '@darkregena',
    'dark regenaissance',
    'mycelial network',
    'underground wisdom'
  ];

  return triggers.some(trigger => lowerText.includes(trigger));
}

async function respondToTweet(tweet: { id: string; text: string }): Promise<void> {
  console.log(`📢 Responding to tweet: ${tweet.text.slice(0, 100)}...`);

  // Create conversation context
  const conversationId = `twitter_auto_${tweet.id}`;
  const conversation: Conversation = {
    id: conversationId,
    platform: 'twitter',
    platformId: tweet.id,
    messages: [{
      id: crypto.randomUUID(),
      role: 'user',
      content: tweet.text,
      timestamp: new Date().toISOString()
    }],
    createdAt: new Date().toISOString()
  };

  // Generate AI response
  const response = await generateResponse(conversation);

  // Post reply
  const replyId = await twitterClient.postTweet(response, tweet.id);
  console.log(`✅ Replied with tweet: ${replyId}`);
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Dark Regenaissance Monitor Cron Job',
    timestamp: new Date().toISOString()
  });
}