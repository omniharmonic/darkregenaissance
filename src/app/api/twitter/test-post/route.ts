import { NextRequest, NextResponse } from 'next/server';
import { twitterClient } from '../../../../../lib/twitter/client';
import { db } from '../../../../../lib/services/database';
import { generateInsight } from '../../../../../lib/services/ai';

export async function POST(request: NextRequest) {
  try {
    // Safety check - require manual confirmation
    const body = await request.json().catch(() => ({}));
    if (!body.confirm) {
      return NextResponse.json({
        error: 'Manual confirmation required',
        instructions: 'Add {"confirm": true} to request body to proceed with test post',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log('🧪 Manual Twitter post test initiated');

    // Check database connection first
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      return NextResponse.json({
        error: 'Database not healthy',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Check rate limits
    const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
    if (!canWrite) {
      return NextResponse.json({
        error: 'Twitter write limit reached for today',
        timestamp: new Date().toISOString()
      }, { status: 429 });
    }

    // Generate a test insight
    const testInsight = body.message || await generateInsight();
    console.log(`📝 Generated insight: ${testInsight.slice(0, 100)}...`);

    // Track AI usage
    if (!body.message) {
      await db.trackUsage('gemini', 'generate', 1);
    }

    // Post to Twitter
    const tweetId = await twitterClient.postTweet(`🧪 TEST: ${testInsight}`);
    console.log(`✅ Posted test tweet: ${tweetId}`);

    // Track Twitter usage
    await db.trackUsage('twitter', 'write', 1);

    // Record this as a manual test interaction
    await db.recordInteraction(
      'twitter',
      tweetId,
      'post',
      undefined,
      {
        content: testInsight,
        type: 'manual_test',
        source: 'test_endpoint',
        testMode: true
      }
    );

    return NextResponse.json({
      success: true,
      tweetId,
      insight: testInsight,
      database: 'healthy',
      rateLimitsOk: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Twitter post test error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get current status without posting
    const dbHealthy = await db.healthCheck();
    const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
    const todayUsage = await db.getUsageStats('twitter', new Date().toISOString().split('T')[0]);

    return NextResponse.json({
      status: 'ready_for_testing',
      database: dbHealthy ? 'healthy' : 'unhealthy',
      canPost: canWrite,
      todayUsage,
      instructions: 'Use POST with {"confirm": true} to test posting',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}