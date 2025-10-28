import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/services/database';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get Twitter usage stats
    const todayUsage = await db.getUsageStats('twitter', today, today);
    const yesterdayUsage = await db.getUsageStats('twitter', yesterday, yesterday);
    const last7DaysUsage = await db.getUsageStats('twitter',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      today
    );

    // Get recent Twitter interactions
    const recentInteractions = await db.getUnprocessedInteractions('twitter', 10);

    // Get interaction stats
    const interactionStats = await db.getInteractionStats(7);

    // Get recent Twitter conversations
    const recentConversations = await db.getRecentConversations('twitter', 10);

    // Check rate limits
    const canRead = await db.checkUsageLimit('twitter', 'read', 100);
    const canWrite = await db.checkUsageLimit('twitter', 'write', 50);

    // Database health
    const dbHealthy = await db.healthCheck();

    // Get Gemini usage (for AI responses)
    const geminiUsage = await db.getUsageStats('gemini', today, today);

    return NextResponse.json({
      status: 'debug_info',
      database: {
        healthy: dbHealthy,
        connected: true
      },
      rateLimits: {
        canRead,
        canWrite,
        dailyLimits: {
          read: 100,
          write: 50
        }
      },
      usage: {
        today: todayUsage,
        yesterday: yesterdayUsage,
        last7Days: last7DaysUsage,
        geminiToday: geminiUsage
      },
      interactions: {
        recent: recentInteractions,
        stats: interactionStats
      },
      conversations: {
        recent: recentConversations,
        count: recentConversations.length
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasTwitterKeys: !!(
          process.env.TWITTER_API_KEY &&
          process.env.TWITTER_API_SECRET &&
          process.env.TWITTER_ACCESS_TOKEN &&
          process.env.TWITTER_ACCESS_SECRET
        ),
        hasSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasGemini: !!process.env.GEMINI_API_KEY
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Twitter debug error:', error);

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}