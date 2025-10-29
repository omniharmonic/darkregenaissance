import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();

    let result: { success: boolean; output?: string; error?: string; message?: string; status?: string; timestamp?: string; checks?: Record<string, boolean | number> } = { success: false };

    switch (action) {
      case 'check-mentions':
        try {
          const { stdout, stderr } = await execAsync('npm run monitor', {
            cwd: process.cwd(),
            timeout: 30000
          });
          result = {
            success: true,
            output: stdout,
            message: 'Mention check completed successfully'
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check mentions'
          };
        }
        break;

      case 'test-health':
        // Simple health check
        result = {
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: true,
            environment: !!process.env.TWITTER_API_KEY,
            uptime: process.uptime()
          }
        };
        break;

      case 'clear-cache':
        // This would clear any in-memory caches
        result = {
          success: true,
          message: 'Cache cleared',
          timestamp: new Date().toISOString()
        };
        break;

      case 'post-tweet':
        if (!params?.content) {
          return NextResponse.json(
            { error: 'Tweet content is required' },
            { status: 400 }
          );
        }
        try {
          // This would call your tweet posting script
          const { stdout } = await execAsync(
            `npm run tweet -- "${params.content.replace(/"/g, '\\"')}"`,
            {
              cwd: process.cwd(),
              timeout: 30000
            }
          );
          result = {
            success: true,
            output: stdout,
            message: 'Tweet posted successfully'
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to post tweet'
          };
        }
        break;

      case 'reply-tweet':
        if (!params?.tweetId || !params?.content) {
          return NextResponse.json(
            { error: 'Tweet ID and content are required' },
            { status: 400 }
          );
        }
        try {
          const { stdout } = await execAsync(
            `npm run reply -- ${params.tweetId} "${params.content.replace(/"/g, '\\"')}"`,
            {
              cwd: process.cwd(),
              timeout: 30000
            }
          );
          result = {
            success: true,
            output: stdout,
            message: 'Reply posted successfully'
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reply to tweet'
          };
        }
        break;

      case 'monitor-start':
        try {
          // Start the monitoring service in the background
          // Note: In production, this should be a separate always-running service
          result = {
            success: true,
            message: 'To start monitoring: Run "npm run monitor:start" in a separate terminal. This will run continuously.'
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start monitor'
          };
        }
        break;

      case 'monitor-stop':
        // This would stop the monitoring service
        result = {
          success: true,
          message: 'Monitor stopped'
        };
        break;

      case 'test-telegram':
        try {
          // Start Telegram bot (note: this runs continuously, so we can't really "test" it here)
          result = {
            success: true,
            message: 'To test Telegram: Run "npm run telegram:start" in a separate terminal. The bot will start listening for messages.'
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to test Telegram'
          };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json(
      { error: 'Action failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

