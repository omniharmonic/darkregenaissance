import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '../../../../../lib/twitter/client';
import { generateInsight } from '../../../../../lib/services/ai';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌅 Posting scheduled tweet...');

    // Generate AI insight
    const insight = await generateInsight();

    // Post the tweet
    const tweetId = await twitterClient.postTweet(insight);

    console.log(`✅ Scheduled tweet posted: ${tweetId}`);

    return NextResponse.json({
      success: true,
      tweetId,
      content: insight,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error posting scheduled tweet:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Dark Regenaissance Tweet Cron Job',
    timestamp: new Date().toISOString()
  });
}