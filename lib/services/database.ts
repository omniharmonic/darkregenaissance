import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database Types
export interface Conversation {
  id: string;
  platform: 'web' | 'telegram' | 'twitter';
  platform_id?: string;
  user_id?: string;
  status: 'active' | 'closed' | 'archived';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Interaction {
  id: string;
  platform: 'web' | 'telegram' | 'twitter';
  platform_interaction_id: string;
  interaction_type: 'mention' | 'reply' | 'direct_message' | 'post' | 'comment';
  user_id?: string;
  processed: boolean;
  response_sent: boolean;
  conversation_id?: string;
  metadata?: Record<string, any>;
  processed_at?: string;
  created_at: string;
}

export interface UsageTracking {
  id: string;
  platform: 'twitter' | 'telegram' | 'gemini';
  operation_type: 'read' | 'write' | 'search' | 'generate';
  operation_count: number;
  date: string;
  metadata?: Record<string, any>;
  created_at: string;
}

class DatabaseService {
  private supabase: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (this.supabase) return this.supabase;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    return this.supabase;
  }

  // Interaction Management

  /**
   * Check if an interaction has already been processed
   */
  async isInteractionProcessed(platform: string, platformInteractionId: string): Promise<boolean> {
    const { data, error } = await this.getClient()
      .from('interactions')
      .select('id')
      .eq('platform', platform)
      .eq('platform_interaction_id', platformInteractionId)
      .eq('processed', true)
      .limit(1);

    if (error) {
      console.error('Error checking interaction:', error);
      return false; // Fail open to avoid blocking responses
    }

    return data && data.length > 0;
  }

  /**
   * Record a new interaction
   */
  async recordInteraction(
    platform: string,
    platformInteractionId: string,
    interactionType: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    const { data, error } = await this.getClient()
      .from('interactions')
      .upsert({
        platform,
        platform_interaction_id: platformInteractionId,
        interaction_type: interactionType,
        user_id: userId,
        metadata,
        processed: false,
        response_sent: false
      }, {
        onConflict: 'platform,platform_interaction_id'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording interaction:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Mark an interaction as processed with response sent
   */
  async markInteractionProcessed(
    platform: string,
    platformInteractionId: string,
    conversationId?: string
  ): Promise<boolean> {
    const { error } = await this.getClient()
      .from('interactions')
      .update({
        processed: true,
        response_sent: true,
        processed_at: new Date().toISOString(),
        ...(conversationId && { conversation_id: conversationId })
      })
      .eq('platform', platform)
      .eq('platform_interaction_id', platformInteractionId);

    if (error) {
      console.error('Error marking interaction as processed:', error);
      return false;
    }

    return true;
  }

  /**
   * Get recent unprocessed interactions for a platform
   */
  async getUnprocessedInteractions(
    platform: string,
    limit: number = 10
  ): Promise<Interaction[]> {
    const { data, error } = await this.getClient()
      .from('interactions')
      .select('*')
      .eq('platform', platform)
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching unprocessed interactions:', error);
      return [];
    }

    return data || [];
  }

  // Conversation Management

  /**
   * Create a new conversation
   */
  async createConversation(
    platform: string,
    platformId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    const { data, error } = await this.getClient()
      .from('conversations')
      .insert({
        platform,
        platform_id: platformId,
        user_id: userId,
        status: 'active',
        metadata
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await this.getClient()
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data;
  }

  /**
   * Get conversation by platform and platform ID
   */
  async getConversationByPlatformId(
    platform: string,
    platformId: string
  ): Promise<Conversation | null> {
    const { data, error } = await this.getClient()
      .from('conversations')
      .select('*')
      .eq('platform', platform)
      .eq('platform_id', platformId)
      .single();

    if (error) {
      // No conversation found is not an error
      return null;
    }

    return data;
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    const { data, error } = await this.getClient()
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    // Update conversation timestamp
    await this.getClient()
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data?.id || null;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit?: number): Promise<Message[]> {
    let query = this.getClient()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get recent conversations for a platform
   */
  async getRecentConversations(
    platform?: string,
    limit: number = 20
  ): Promise<Conversation[]> {
    let query = this.getClient()
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  }

  // Usage Tracking

  /**
   * Track API usage
   */
  async trackUsage(
    platform: string,
    operationType: string,
    count: number = 1,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const { error } = await this.getClient()
      .from('usage_tracking')
      .upsert({
        platform,
        operation_type: operationType,
        operation_count: count,
        date,
        metadata
      }, {
        onConflict: 'platform,operation_type,date'
      });

    if (error) {
      console.error('Error tracking usage:', error);
      return false;
    }

    return true;
  }

  /**
   * Get usage stats for a platform and date range
   */
  async getUsageStats(
    platform?: string,
    startDate?: string,
    endDate?: string
  ): Promise<UsageTracking[]> {
    let query = this.getClient()
      .from('usage_tracking')
      .select('*')
      .order('date', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching usage stats:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if usage is within limits for today
   */
  async checkUsageLimit(
    platform: string,
    operationType: string,
    dailyLimit: number
  ): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.getClient()
      .from('usage_tracking')
      .select('operation_count')
      .eq('platform', platform)
      .eq('operation_type', operationType)
      .eq('date', today)
      .single();

    if (error) {
      // No usage recorded yet, so we're within limits
      return true;
    }

    return (data?.operation_count || 0) < dailyLimit;
  }

  // Analytics and Reporting

  /**
   * Get interaction statistics
   */
  async getInteractionStats(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.getClient()
      .from('daily_interaction_stats')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching interaction stats:', error);
      return null;
    }

    return data;
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(platform?: string): Promise<any> {
    let query = this.getClient()
      .from('conversations')
      .select('platform, status, created_at');

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversation stats:', error);
      return null;
    }

    // Process statistics
    const stats = {
      total: data?.length || 0,
      byPlatform: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recent: 0 // last 24 hours
    };

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    data?.forEach(conv => {
      stats.byPlatform[conv.platform] = (stats.byPlatform[conv.platform] || 0) + 1;
      stats.byStatus[conv.status] = (stats.byStatus[conv.status] || 0) + 1;

      if (new Date(conv.created_at) > yesterday) {
        stats.recent++;
      }
    });

    return stats;
  }

  // Health Check

  /**
   * Check database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.getClient()
        .from('conversations')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Helper functions for backward compatibility with existing conversation service

/**
 * Migration helper: Convert file-based conversation to database
 */
export async function migrateFileConversation(
  fileConversation: any
): Promise<string | null> {
  const conversationId = await db.createConversation(
    fileConversation.platform,
    fileConversation.platformId,
    undefined,
    { migrated: true, originalId: fileConversation.id }
  );

  if (!conversationId) return null;

  // Add all messages
  for (const message of fileConversation.messages) {
    await db.addMessage(
      conversationId,
      message.role,
      message.content,
      { originalId: message.id, timestamp: message.timestamp }
    );
  }

  return conversationId;
}