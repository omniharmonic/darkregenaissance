import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch all monitored accounts
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { data, error } = await supabase
      .from('twitter_accounts')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;

    // Get interaction counts for each account
    const accountsWithStats = await Promise.all(
      (data || []).map(async (account) => {
        const { count } = await supabase
          .from('twitter_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('from_username', account.username);

        return {
          ...account,
          interactions: count || 0
        };
      })
    );

    return NextResponse.json({
      accounts: accountsWithStats,
      total: accountsWithStats.length
    });

  } catch (error) {
    console.error('Accounts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST - Add new account to monitor
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const body = await request.json();
    const { username, priority, category, strategy } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if account already exists
    const { data: existing } = await supabase
      .from('twitter_accounts')
      .select('id')
      .eq('username', username.replace('@', ''))
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Account already monitored' }, { status: 409 });
    }

    // Add new account
    const { data, error } = await supabase
      .from('twitter_accounts')
      .insert({
        username: username.replace('@', ''),
        priority: priority || 'medium',
        category: category || 'general',
        strategy: strategy || {},
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account: data, success: true });

  } catch (error) {
    console.error('Account add error:', error);
    return NextResponse.json({ error: 'Failed to add account' }, { status: 500 });
  }
}

// DELETE - Remove account from monitoring
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('twitter_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

// PATCH - Update account settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const body = await request.json();
    const { id, priority, category, strategy, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const updates: Record<string, string | boolean | object> = {};
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (strategy !== undefined) updates.strategy = strategy;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('twitter_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account: data, success: true });

  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

