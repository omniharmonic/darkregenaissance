import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          role,
          created_at
        )
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get Twitter interactions separately
    const { data: twitterData } = await supabase
      .from('interactions')
      .select('*')
      .eq('platform', 'twitter')
      .order('created_at', { ascending: false })
      .limit(platform === 'twitter' || platform === 'all' ? limit : 0);

    // Format response
    const conversations = [
      ...(data || []).map(conv => ({
        id: conv.id,
        platform: conv.platform,
        started_at: conv.created_at,
        last_message: conv.updated_at,
        message_count: conv.messages?.length || 0,
        messages: conv.messages || [],
        metadata: conv.metadata
      })),
      ...(twitterData || []).map(tweet => ({
        id: tweet.id,
        platform: 'twitter',
        started_at: tweet.created_at,
        last_message: tweet.created_at,
        message_count: 1,
        messages: [{
          id: tweet.id,
          content: tweet.metadata?.content || 'No content',
          role: tweet.interaction_type === 'mention' ? 'user' : 'assistant',
          created_at: tweet.created_at
        }],
        metadata: {
          platform_interaction_id: tweet.platform_interaction_id,
          interaction_type: tweet.interaction_type,
          user_id: tweet.user_id,
          ...tweet.metadata
        }
      }))
    ].sort((a, b) => new Date(b.last_message).getTime() - new Date(a.last_message).getTime());

    return NextResponse.json({
      conversations,
      total: conversations.length,
      offset,
      limit
    });

  } catch (error) {
    console.error('Conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

