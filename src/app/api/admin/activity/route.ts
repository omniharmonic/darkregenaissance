import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    // Get recent Twitter interactions
    const { data: twitterData } = await supabase
      .from('interactions')
      .select('*')
      .eq('platform', 'twitter')
      .order('created_at', { ascending: false })
      .limit(20);

    // Get recent web conversations
    const { data: webData } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('platform', 'web')
      .order('updated_at', { ascending: false })
      .limit(10);

    // Get recent telegram conversations
    const { data: telegramData } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('platform', 'telegram')
      .order('updated_at', { ascending: false })
      .limit(10);

    // Combine and format activities
    const activities = [
      ...(twitterData || []).map(t => ({
        id: t.id,
        type: 'twitter' as const,
        action: t.response_sent ? 'Replied to interaction' : `Received ${t.interaction_type}`,
        timestamp: t.created_at,
        details: `@${t.user_id || 'unknown'}: ${t.metadata?.content?.substring(0, 100) || t.interaction_type || 'Twitter interaction'}`
      })),
      ...(webData || []).map(c => ({
        id: c.id,
        type: 'web' as const,
        action: 'Web conversation',
        timestamp: c.updated_at,
        details: `${c.messages?.length || 0} messages`
      })),
      ...(telegramData || []).map(c => ({
        id: c.id,
        type: 'telegram' as const,
        action: 'Telegram conversation',
        timestamp: c.updated_at,
        details: `${c.messages?.length || 0} messages`
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Activity error:', error);
    return NextResponse.json([]);
  }
}

