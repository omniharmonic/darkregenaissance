import { TwitterApi } from 'twitter-api-v2';
import { db } from '../services/database';

export interface TwitterUsage {
  read: number;
  write: number;
  lastReset: string;
  dailyLimit: {
    read: number;
    write: number;
  };
}

export interface TweetData {
  id: string;
  text: string;
  createdAt: string;
  authorId?: string;
  replyToId?: string;
  conversationId?: string;
}

class TwitterClient {
  private client: TwitterApi | null = null;

  constructor() {
    // Database-based storage - no file paths needed
  }

  private initializeClient() {
    if (this.client) return this.client;

    if (!process.env.TWITTER_BEARER_TOKEN ||
        !process.env.TWITTER_API_KEY ||
        !process.env.TWITTER_API_SECRET ||
        !process.env.TWITTER_ACCESS_TOKEN ||
        !process.env.TWITTER_ACCESS_SECRET) {
      throw new Error('Twitter API credentials not found in environment variables');
    }

    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    return this.client;
  }

  private async checkRateLimit(type: 'read' | 'write'): Promise<boolean> {
    // Use database-based rate limiting
    const limit = type === 'read' ? 100 : 50;
    return await db.checkUsageLimit('twitter', type, limit);
  }

  private async trackUsage(type: 'read' | 'write'): Promise<void> {
    // Track usage in database
    await db.trackUsage('twitter', type, 1);
  }

  async postTweet(text: string, replyToId?: string): Promise<string> {
    if (!await this.checkRateLimit('write')) {
      throw new Error('Daily write limit exceeded');
    }

    if (text.length > 280) {
      throw new Error('Tweet exceeds 280 character limit');
    }

    try {
      const client = this.initializeClient();
      const response = await client.v2.tweet({
        text,
        ...(replyToId && { reply: { in_reply_to_tweet_id: replyToId } })
      });

      await this.trackUsage('write');

      return response.data.id;
    } catch (error) {
      console.error('Failed to post tweet:', error);
      throw new Error(`Failed to post tweet: ${error}`);
    }
  }

  async getTweet(tweetId: string): Promise<TweetData | null> {
    if (!await this.checkRateLimit('read')) {
      throw new Error('Daily read limit exceeded');
    }

    try {
      const client = this.initializeClient();
      const response = await client.v2.singleTweet(tweetId, {
        'tweet.fields': ['created_at', 'author_id', 'in_reply_to_user_id', 'conversation_id']
      });

      await this.trackUsage('read');

      if (!response.data) {
        return null;
      }

      return {
        id: response.data.id,
        text: response.data.text,
        createdAt: response.data.created_at || new Date().toISOString(),
        authorId: response.data.author_id,
        replyToId: response.data.in_reply_to_user_id,
        conversationId: response.data.conversation_id
      };
    } catch (error) {
      console.error('Failed to get tweet:', error);
      throw new Error(`Failed to get tweet: ${error}`);
    }
  }

  async getUsageStats(): Promise<{
    read: number;
    write: number;
    lastReset: string;
    dailyLimit: { read: number; write: number };
  }> {
    // Get today's usage from database
    const today = new Date().toISOString().split('T')[0];
    const usage = await db.getUsageStats('twitter', today, today);

    const readUsage = usage.find(u => u.operation_type === 'read')?.operation_count || 0;
    const writeUsage = usage.find(u => u.operation_type === 'write')?.operation_count || 0;

    return {
      read: readUsage,
      write: writeUsage,
      lastReset: today,
      dailyLimit: {
        read: 100,
        write: 50
      }
    };
  }

  async searchTweets(query: string, maxResults: number = 10): Promise<TweetData[]> {
    // Ensure maxResults is within Twitter API limits
    maxResults = Math.max(10, Math.min(maxResults, 100));
    if (!await this.checkRateLimit('read')) {
      throw new Error('Daily read limit exceeded');
    }

    try {
      const client = this.initializeClient();
      const response = await client.v2.search(query, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'author_id', 'in_reply_to_user_id', 'conversation_id']
      });

      await this.trackUsage('read');

      return response.data?.data?.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at || new Date().toISOString(),
        authorId: tweet.author_id,
        replyToId: tweet.in_reply_to_user_id,
        conversationId: tweet.conversation_id
      })) || [];
    } catch (error) {
      console.error('Failed to search tweets:', error);
      throw new Error(`Failed to search tweets: ${error}`);
    }
  }

  async getConversationThread(conversationId: string, maxTweets: number = 20): Promise<TweetData[]> {
    if (!await this.checkRateLimit('read')) {
      throw new Error('Daily read limit exceeded');
    }

    try {
      const client = this.initializeClient();
      const response = await client.v2.search(`conversation_id:${conversationId}`, {
        max_results: Math.min(maxTweets, 100), // API limit is 100
        'tweet.fields': ['created_at', 'author_id', 'in_reply_to_user_id', 'conversation_id'],
        sort_order: 'chronological'
      });

      await this.trackUsage('read');

      return response.data?.data?.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at || new Date().toISOString(),
        authorId: tweet.author_id,
        replyToId: tweet.in_reply_to_user_id,
        conversationId: tweet.conversation_id
      })) || [];
    } catch (error) {
      console.error('Failed to get conversation thread:', error);
      throw new Error(`Failed to get conversation thread: ${error}`);
    }
  }

  async getThreadContext(tweetId: string, maxContextTweets: number = 10): Promise<{
    currentTweet: TweetData;
    threadTweets: TweetData[];
    totalContext: string;
  }> {
    // Get the current tweet first to get conversation ID
    const currentTweet = await this.getTweet(tweetId);
    if (!currentTweet) {
      throw new Error(`Tweet ${tweetId} not found`);
    }

    // If there's no conversation ID, this is a standalone tweet
    if (!currentTweet.conversationId) {
      return {
        currentTweet,
        threadTweets: [currentTweet],
        totalContext: currentTweet.text
      };
    }

    // Get the full conversation thread
    const threadTweets = await this.getConversationThread(currentTweet.conversationId, maxContextTweets);

    // Sort by creation time to get chronological order
    threadTweets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Create a context string that includes all tweets in the thread up to the current tweet
    const currentTweetIndex = threadTweets.findIndex(tweet => tweet.id === tweetId);
    const contextTweets = currentTweetIndex >= 0 ? threadTweets.slice(0, currentTweetIndex + 1) : threadTweets;

    const totalContext = contextTweets
      .map((tweet, index) => `${index + 1}. ${tweet.text}`)
      .join('\n\n');

    return {
      currentTweet,
      threadTweets: contextTweets,
      totalContext
    };
  }
}

export const twitterClient = new TwitterClient();