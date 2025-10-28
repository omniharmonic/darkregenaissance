import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return NextResponse.json({
        status: 'error',
        error: 'TELEGRAM_BOT_TOKEN not configured',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Test Telegram Bot API connection
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({
        status: 'healthy',
        bot: {
          id: data.result.id,
          username: data.result.username,
          first_name: data.result.first_name,
          can_join_groups: data.result.can_join_groups,
          can_read_all_group_messages: data.result.can_read_all_group_messages,
          supports_inline_queries: data.result.supports_inline_queries
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'error',
        error: 'Telegram API error',
        details: data,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}