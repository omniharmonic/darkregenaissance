import { NextRequest, NextResponse } from 'next/server';
import { twitterMonitor } from '../../../../../lib/twitter/monitor';
import { targetAccountMonitor } from '../../../../../lib/twitter/account-monitor';
import { db } from '../../../../../lib/services/database';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Enhanced Twitter Monitoring Cron Job Started');

    let processedMentions = 0;
    let processedTargetAccounts = 0;
    const errors: string[] = [];
    const results: string[] = [];

    // Check rate limits before starting
    const canRead = await db.checkUsageLimit('twitter', 'read', 100);

    if (!canRead) {
      console.log('⏰ Twitter read limit reached for today');
      return NextResponse.json({
        success: true,
        processedMentions: 0,
        processedTargetAccounts: 0,
        message: 'Daily read limit reached',
        timestamp: new Date().toISOString()
      });
    }

    // 1. ENHANCED MENTION MONITORING with Thread Context
    console.log('🔍 Running enhanced mention monitoring...');
    try {
      await twitterMonitor.checkMentions();
      results.push('✅ Mention monitoring completed');
      processedMentions = 1; // Will be updated by actual processing
    } catch (error) {
      console.error('Error in mention monitoring:', error);
      errors.push(`Mention monitoring: ${error}`);
    }

    // 2. TARGET ACCOUNT MONITORING
    console.log('🎯 Running target account monitoring...');
    try {
      // Load target account monitor if not already loaded
      await targetAccountMonitor.loadConfig();

      // Get high-priority accounts for cron run
      const status = targetAccountMonitor.getStatus();

      if (status.accountCount > 0) {
        // Note: Target account monitor runs continuously in production
        // For cron, we just trigger a check if it's not running
        if (!status.running) {
          console.log('🎯 Target account monitor not running, triggering manual check...');
          // Manually trigger a batch check for high-priority accounts
          await triggerHighPriorityCheck();
          processedTargetAccounts = 1;
        } else {
          results.push('✅ Target account monitor already running');
        }
      }
    } catch (error) {
      console.error('Error in target account monitoring:', error);
      errors.push(`Target account monitoring: ${error}`);
    }

    // 3. USAGE STATISTICS
    const usage = await db.getUsageStats('twitter',
      new Date().toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const readUsage = usage.find(u => u.operation_type === 'read')?.operation_count || 0;
    const writeUsage = usage.find(u => u.operation_type === 'write')?.operation_count || 0;

    results.push(`📊 API Usage: ${readUsage}/100 reads, ${writeUsage}/50 writes`);

    // 4. FALLBACK RESPONSE MECHANISM
    // Ensure bot posts something if no mentions or target accounts were processed
    if (processedMentions === 0 && processedTargetAccounts === 0 && writeUsage < 50) {
      console.log('🔄 No activity processed, triggering fallback response...');
      try {
        await triggerFallbackResponse();
        results.push('✅ Fallback response posted');
      } catch (error) {
        console.error('Error in fallback response:', error);
        errors.push(`Fallback response: ${error}`);
      }
    }

    console.log('✅ Enhanced monitoring cron job completed');

    return NextResponse.json({
      success: true,
      enhanced: true,
      processedMentions,
      processedTargetAccounts,
      results,
      usage: { read: readUsage, write: writeUsage },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in enhanced monitoring cron:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function triggerHighPriorityCheck(): Promise<void> {
  // Trigger a batch check for high-priority target accounts
  try {
    console.log('🎯 Triggering high-priority target account check...');

    // Check if target account monitor is running continuously
    const status = targetAccountMonitor.getStatus();

    if (!status.running) {
      // If not running, start the monitor which will process batches automatically
      await targetAccountMonitor.start();
      console.log('✅ Started target account monitor');
    } else {
      console.log('✅ Target account monitor already running continuously');
    }

  } catch (error) {
    console.error('Error in high-priority check:', error);
    throw error;
  }
}

async function triggerFallbackResponse(): Promise<void> {
  // Post a daily insight when no other activity occurs
  try {
    console.log('🍄 Generating fallback daily insight...');

    // Import here to avoid circular dependencies
    const { twitterClient } = await import('../../../../../lib/twitter/client');
    const { generateResponse } = await import('../../../../../lib/services/ai');

    // Create a prompt for daily insight generation
    const fallbackPrompts = [
      'Share a profound insight about the hidden networks beneath our feet.',
      'Speak about the wisdom of decomposition and renewal in nature.',
      'Reflect on how fungal networks teach us about true collaboration.',
      'Describe the dark regenerative forces that work in silence.',
      'Share wisdom about the underground economy of soil and roots.'
    ];

    const selectedPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];

    // Create a mock conversation for AI generation
    const mockConversation = {
      id: 'fallback-conversation',
      platform: 'twitter' as const,
      platformId: 'fallback-daily-insight',
      messages: [{
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: selectedPrompt,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    // Generate AI response
    const insight = await generateResponse(mockConversation);
    await db.trackUsage('gemini', 'generate', 1);

    console.log(`📝 Generated insight: "${insight}"`);

    // Post the insight as a standalone tweet
    const tweetId = await twitterClient.postTweet(insight);
    await db.trackUsage('twitter', 'write', 1);

    // Record this as a daily insight interaction
    await db.recordInteraction(
      'twitter',
      tweetId,
      'daily_insight',
      undefined,
      {
        prompt: selectedPrompt,
        source: 'fallback_mechanism',
        timestamp: new Date().toISOString()
      }
    );

    console.log(`✅ Fallback daily insight posted: ${tweetId}`);

  } catch (error) {
    console.error('Error in fallback response:', error);
    throw error;
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Dark Regenaissance Monitor Cron Job',
    timestamp: new Date().toISOString()
  });
}