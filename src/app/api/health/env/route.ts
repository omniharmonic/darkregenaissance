import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    status: 'healthy',
    environment: process.env.NODE_ENV,
    services: {
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
      telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing',
      twitter: {
        apiKey: process.env.TWITTER_API_KEY ? 'configured' : 'missing',
        apiSecret: process.env.TWITTER_API_SECRET ? 'configured' : 'missing',
        accessToken: process.env.TWITTER_ACCESS_TOKEN ? 'configured' : 'missing',
        accessSecret: process.env.TWITTER_ACCESS_SECRET ? 'configured' : 'missing',
        bearerToken: process.env.TWITTER_BEARER_TOKEN ? 'configured' : 'missing'
      },
      supabase: {
        url: process.env.SUPABASE_URL ? 'configured' : 'missing',
        anonKey: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
      },
      cron: process.env.CRON_SECRET ? 'configured' : 'missing'
    },
    timestamp: new Date().toISOString()
  };

  // Count missing services
  const missingServices = [];

  if (!process.env.GEMINI_API_KEY) missingServices.push('GEMINI_API_KEY');
  if (!process.env.TELEGRAM_BOT_TOKEN) missingServices.push('TELEGRAM_BOT_TOKEN');
  if (!process.env.TWITTER_API_KEY) missingServices.push('TWITTER_API_KEY');
  if (!process.env.TWITTER_API_SECRET) missingServices.push('TWITTER_API_SECRET');
  if (!process.env.TWITTER_ACCESS_TOKEN) missingServices.push('TWITTER_ACCESS_TOKEN');
  if (!process.env.TWITTER_ACCESS_SECRET) missingServices.push('TWITTER_ACCESS_SECRET');
  if (!process.env.TWITTER_BEARER_TOKEN) missingServices.push('TWITTER_BEARER_TOKEN');
  if (!process.env.SUPABASE_URL) missingServices.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingServices.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.CRON_SECRET) missingServices.push('CRON_SECRET');

  if (missingServices.length > 0) {
    envCheck.status = 'degraded';
    (envCheck as typeof envCheck & { missingVariables: string[] }).missingVariables = missingServices;
  }

  const status = missingServices.length > 0 ? 503 : 200;

  return NextResponse.json(envCheck, { status });
}