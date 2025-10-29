import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    // Get Twitter stats
    const { count: twitterMentions } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'twitter');

    const { count: twitterResponses } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'twitter')
      .eq('response_sent', true);

    const { count: targetAccounts } = await supabase
      .from('twitter_accounts')
      .select('*', { count: 'exact', head: true });

    // Get Web conversation stats
    const { count: webConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'web');

    // Get web messages count via conversations
    const { data: webConvIds } = await supabase
      .from('conversations')
      .select('id')
      .eq('platform', 'web');

    const webConvIdsList = webConvIds?.map(c => c.id) || [];
    const { count: webMessages } = webConvIdsList.length > 0 
      ? await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', webConvIdsList)
      : { count: 0 };

    // Get Telegram stats
    const { count: telegramConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'telegram');

    const { data: telegramConvIds } = await supabase
      .from('conversations')
      .select('id')
      .eq('platform', 'telegram');

    const telegramConvIdsList = telegramConvIds?.map(c => c.id) || [];
    const { count: telegramMessages } = telegramConvIdsList.length > 0
      ? await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', telegramConvIdsList)
      : { count: 0 };

    // Get system health
    const { data: lastCheck } = await supabase
      .from('interactions')
      .select('created_at')
      .eq('platform', 'twitter')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const stats = {
      twitter: {
        mentions: twitterMentions || 0,
        responses: twitterResponses || 0,
        targetAccounts: targetAccounts || 0,
        apiCalls: 0 // Could be tracked in usage_tracking table
      },
      web: {
        conversations: webConversations || 0,
        messages: webMessages || 0
      },
      telegram: {
        conversations: telegramConversations || 0,
        messages: telegramMessages || 0
      },
      system: {
        uptime: process.uptime() ? `${Math.floor(process.uptime() / 3600)}h` : 'Unknown',
        lastCheck: lastCheck?.created_at || new Date().toISOString(),
        health: 'healthy' as const
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      twitter: { mentions: 0, responses: 0, targetAccounts: 0, apiCalls: 0 },
      web: { conversations: 0, messages: 0 },
      telegram: { conversations: 0, messages: 0 },
      system: { uptime: 'Unknown', lastCheck: new Date().toISOString(), health: 'error' as const }
    });
  }
}

