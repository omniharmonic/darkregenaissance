import { NextResponse } from 'next/server';
import { db } from '../../../../lib/services/database';

export async function GET() {
  const health = {
    status: 'healthy',
    service: 'Dark Regenaissance API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    services: {
      database: 'checking...',
      environment: 'checking...',
      telegram: 'checking...',
      twitter: 'checking...'
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Check database
    const dbHealthy = await db.healthCheck();
    health.services.database = dbHealthy ? 'healthy' : 'unhealthy';

    // Check environment variables
    const requiredEnvVars = [
      'GEMINI_API_KEY',
      'TELEGRAM_BOT_TOKEN',
      'TWITTER_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    health.services.environment = missingEnvVars.length === 0 ? 'healthy' : `missing: ${missingEnvVars.join(', ')}`;

    // Check Telegram bot
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
        const telegramData = await telegramResponse.json();
        health.services.telegram = telegramData.ok ? 'healthy' : 'api_error';
      } catch {
        health.services.telegram = 'connection_error';
      }
    } else {
      health.services.telegram = 'token_missing';
    }

    // Check Twitter credentials
    const twitterCreds = ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'];
    const missingTwitterCreds = twitterCreds.filter(cred => !process.env[cred]);
    health.services.twitter = missingTwitterCreds.length === 0 ? 'configured' : `missing: ${missingTwitterCreds.join(', ')}`;

    // Determine overall status
    const serviceStatuses = Object.values(health.services);
    if (serviceStatuses.some(status => status.includes('error') || status.includes('unhealthy') || status.includes('missing'))) {
      health.status = 'degraded';
    }

    return NextResponse.json(health);

  } catch (error) {
    health.status = 'error';
    (health as typeof health & { error: string }).error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(health, { status: 500 });
  }
}