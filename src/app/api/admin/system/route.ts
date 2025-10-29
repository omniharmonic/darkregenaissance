import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    // Database health check
    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    const dbLatency = Date.now() - dbStart;

    // Get recent interactions that failed processing
    const { data: recentErrors } = await supabase
      .from('interactions')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // API usage tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayInteractions } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'twitter')
      .gte('created_at', today.toISOString());

    // Rate limiting status
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const { count: lastHourRequests } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'twitter')
      .gte('created_at', lastHour.toISOString());

    const systemInfo = {
      database: {
        status: dbError ? 'error' : 'healthy',
        latency: dbLatency,
        error: dbError?.message
      },
      api: {
        twitter: {
          todayRequests: todayInteractions || 0,
          lastHourRequests: lastHourRequests || 0,
          dailyLimit: 2000,
          hourlyLimit: 100
        },
        openai: {
          todayRequests: 0, // Could track this separately
          monthlyLimit: 10000
        }
      },
      errors: recentErrors || [],
      uptime: {
        seconds: Math.floor(process.uptime()),
        started: new Date(Date.now() - process.uptime() * 1000).toISOString()
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    return NextResponse.json(systemInfo);

  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    );
  }
}

