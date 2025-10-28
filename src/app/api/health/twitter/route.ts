import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/services/database';

export async function GET() {
  try {
    const requiredVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
      'TWITTER_BEARER_TOKEN'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing Twitter credentials',
        missingVariables: missingVars,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Check recent Twitter usage from database
    const today = new Date().toISOString().split('T')[0];
    const usageStats = await db.getUsageStats('twitter', today, today);

    // Check recent interactions
    const recentInteractions = await db.getInteractionStats(1); // Last 1 day

    return NextResponse.json({
      status: 'healthy',
      credentials: 'configured',
      todayUsage: usageStats,
      recentInteractions: recentInteractions,
      database: await db.healthCheck(),
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