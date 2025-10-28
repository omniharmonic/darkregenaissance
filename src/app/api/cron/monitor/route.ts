import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '../../../../../lib/twitter/client';
import { generateResponse } from '../../../../../lib/services/ai';
import { db } from '../../../../../lib/services/database';

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

    // Check rate limits before starting
    const canRead = await db.checkUsageLimit('twitter', 'read', 100);
    const canWrite = await db.checkUsageLimit('twitter', 'write', 50);

    if (!canRead) {
      console.log('⏰ Twitter read limit reached for today');
      return NextResponse.json({
        success: true,
        processedMentions: 0,
        message: 'Daily read limit reached',
        timestamp: new Date().toISOString()
      });
    }

    // Search for mentions - use single query to minimize API calls
    const primaryQuery = '@darkregenaI';

    try {
      const tweets = await twitterClient.searchTweets(primaryQuery, 10);
      await db.trackUsage('twitter', 'read', 1);

      for (const tweet of tweets) {
        try {
          // Check if we've already processed this tweet
          const alreadyProcessed = await db.isInteractionProcessed('twitter', tweet.id);

          if (alreadyProcessed) {
            console.log(`⏭️ Tweet ${tweet.id} already processed, skipping`);
            continue;
          }

          // Check if we should respond to this tweet
          if (shouldRespondToTweet(tweet.text)) {
            // Record the interaction before processing
            await db.recordInteraction(
              'twitter',
              tweet.id,
              'mention',
              tweet.authorId,
              {
                text: tweet.text,
                createdAt: tweet.createdAt,
                source: 'cron_monitor'
              }
            );

            if (canWrite) {
              await respondToTweet(tweet);
              processedMentions++;
            } else {
              console.log('⏰ Twitter write limit reached, queuing for later');
              break;
            }

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

    } catch (error) {
      console.error(`Error searching for mentions:`, error);
      errors.push(`Search error: ${error}`);
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

async function respondToTweet(tweet: { id: string; text: string; authorId?: string; createdAt: string }): Promise<void> {
  console.log(`📢 Responding to tweet: ${tweet.text.slice(0, 100)}...`);

  try {
    // Create conversation in database
    const conversationId = await db.createConversation(
      'twitter',
      tweet.id,
      tweet.authorId,
      {
        tweetText: tweet.text,
        tweetCreatedAt: tweet.createdAt,
        source: 'cron_monitor'
      }
    );

    if (!conversationId) {
      throw new Error('Failed to create conversation in database');
    }

    // Add user message to conversation
    await db.addMessage(conversationId, 'user', tweet.text, {
      tweetId: tweet.id,
      authorId: tweet.authorId
    });

    // Create conversation object for AI generation (legacy format)
    const conversation = {
      id: conversationId,
      platform: 'twitter' as const,
      platformId: tweet.id,
      messages: [{
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: tweet.text,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    // Generate AI response
    const response = await generateResponse(conversation);
    await db.trackUsage('gemini', 'generate', 1);

    // Post reply
    const replyId = await twitterClient.postTweet(response, tweet.id);
    await db.trackUsage('twitter', 'write', 1);

    // Add assistant message to conversation
    await db.addMessage(conversationId, 'assistant', response, {
      replyTweetId: replyId
    });

    // Mark interaction as processed
    await db.markInteractionProcessed('twitter', tweet.id, conversationId);

    console.log(`✅ Replied with tweet: ${replyId}`);

  } catch (error) {
    console.error('Error in respondToTweet:', error);
    // Still mark as processed to avoid retry loops
    await db.markInteractionProcessed('twitter', tweet.id);
    throw error;
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Dark Regenaissance Monitor Cron Job',
    timestamp: new Date().toISOString()
  });
}