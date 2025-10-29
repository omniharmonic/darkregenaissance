import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/services/database';

export async function GET() {
  try {
    console.log('🔍 Testing simple database operations...');

    // Test 1: Simple usage tracking
    console.log('1. Testing usage tracking...');
    const usageResult = await db.trackUsage('twitter', 'write', 1, { test: 'simple' });
    console.log('Usage tracking result:', usageResult);

    // Test 2: Check today's usage
    console.log('2. Checking today\'s usage...');
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = await db.getUsageStats('twitter', today, today);
    console.log('Today usage:', todayUsage);

    // Test 3: Record simple interaction
    console.log('3. Recording interaction...');
    const testId = `simple_test_${Date.now()}`;
    const interactionResult = await db.recordInteraction(
      'twitter',
      testId,
      'post',
      'test_user',
      { simple_test: true }
    );
    console.log('Interaction result:', interactionResult);

    return NextResponse.json({
      success: true,
      results: {
        usageTracking: usageResult,
        todayUsage,
        interactionRecording: interactionResult,
        testId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Simple DB test error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}