import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 500 });
    }

    // First, delete any existing webhook
    console.log('🗑️ Deleting existing webhook...');
    const deleteResponse = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST'
    });
    const deleteResult = await deleteResponse.json();

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the correct webhook URL (use the production domain)
    const webhookUrl = `https://darkregenaissanceai.vercel.app/api/telegram/webhook`;

    console.log(`🔗 Setting webhook to: ${webhookUrl}`);

    // Set the new webhook with specific parameters
    const setResponse = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true,
        max_connections: 40
      })
    });

    const setResult = await setResponse.json();

    // Verify the webhook was set correctly
    const infoResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const infoResult = await infoResponse.json();

    return NextResponse.json({
      steps: {
        deleted: deleteResult,
        set: setResult,
        verification: infoResult.result
      },
      webhookUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook fixer - use POST to reset webhook',
    info: 'This will delete and recreate the webhook with the correct URL'
  });
}