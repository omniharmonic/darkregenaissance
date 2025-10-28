import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/services/database';

export async function GET() {
  try {
    const healthCheck = await db.healthCheck();

    return NextResponse.json({
      status: healthCheck ? 'healthy' : 'unhealthy',
      database: healthCheck,
      supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}