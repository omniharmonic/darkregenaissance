import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '../../../../../lib/twitter/client';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 280) {
      return NextResponse.json(
        { error: 'Tweet exceeds 280 character limit' },
        { status: 400 }
      );
    }

    const tweetId = await twitterClient.postTweet(text);

    return NextResponse.json({
      success: true,
      tweetId,
      url: `https://twitter.com/darkregenaI/status/${tweetId}`,
      text
    });

  } catch (error) {
    console.error('Twitter post error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Daily write limit exceeded')) {
        return NextResponse.json(
          { error: 'Daily posting limit exceeded. Try again tomorrow.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to post tweet' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const usage = await twitterClient.getUsageStats();

    return NextResponse.json({
      usage,
      remainingWrites: usage.dailyLimit.write - usage.write,
      remainingReads: usage.dailyLimit.read - usage.read
    });

  } catch (error) {
    console.error('Failed to get Twitter usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}