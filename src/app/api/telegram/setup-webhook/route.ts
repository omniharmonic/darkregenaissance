import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN not configured'
      }, { status: 503 });
    }

    // Get the webhook URL from request body or construct from domain
    const body = await request.json().catch(() => ({}));
    const webhookUrl = body.webhookUrl ||
      `https://${process.env.VERCEL_URL || request.headers.get('host')}/api/telegram/webhook`;

    console.log(`🔗 Setting up Telegram webhook: ${webhookUrl}`);

    // Set webhook with Telegram
    const setWebhookResponse = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true
      })
    });

    const webhookResult = await setWebhookResponse.json();

    if (!webhookResult.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to set webhook',
        details: webhookResult
      }, { status: 500 });
    }

    // Get webhook info to verify
    const getWebhookResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookInfo = await getWebhookResponse.json();

    return NextResponse.json({
      success: true,
      webhook: {
        url: webhookUrl,
        set: webhookResult,
        info: webhookInfo.result
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check current webhook status
export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({
        configured: false,
        error: 'TELEGRAM_BOT_TOKEN not configured'
      });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookInfo = await response.json();

    return NextResponse.json({
      configured: true,
      webhook: webhookInfo.result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}