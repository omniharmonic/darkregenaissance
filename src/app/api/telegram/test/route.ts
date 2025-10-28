import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 500 });
    }

    // Send a test message to yourself (you'll need to start a chat with the bot first)
    const testMessage = {
      chat_id: '@darkregenbot', // This won't work, but let's see the error
      text: '🧪 Test message from webhook endpoint - if you see this, everything is working!'
    };

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });

    const result = await response.json();

    return NextResponse.json({
      test: 'attempted',
      response: result,
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
    message: 'Telegram test endpoint - use POST to send test message',
    timestamp: new Date().toISOString()
  });
}