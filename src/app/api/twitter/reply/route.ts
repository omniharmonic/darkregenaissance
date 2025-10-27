import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '../../../../../lib/twitter/client';

export async function POST(request: NextRequest) {
  try {
    const { text, tweetId } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!tweetId || typeof tweetId !== 'string') {
      return NextResponse.json(
        { error: 'Tweet ID is required for replies' },
        { status: 400 }
      );
    }

    if (text.length > 280) {
      return NextResponse.json(
        { error: 'Reply exceeds 280 character limit' },
        { status: 400 }
      );
    }

    const replyId = await twitterClient.postTweet(text, tweetId);

    return NextResponse.json({
      success: true,
      replyId,
      originalTweetId: tweetId,
      url: `https://twitter.com/darkregenaI/status/${replyId}`,
      text
    });

  } catch (error) {
    console.error('Twitter reply error:', error);

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
      { error: 'Failed to post reply' },
      { status: 500 }
    );
  }
}