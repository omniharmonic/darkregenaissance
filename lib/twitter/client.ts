import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs/promises';
import path from 'path';

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
}

class TwitterClient {
  private client: TwitterApi | null = null;
  private usageFile: string;

  constructor() {
    this.usageFile = path.join(process.cwd(), 'data', 'tweets', 'usage.json');
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

  private async getUsage(): Promise<TwitterUsage> {
    try {
      const data = await fs.readFile(this.usageFile, 'utf-8');
      const usage = JSON.parse(data) as TwitterUsage;

      // Reset daily counters if it's a new day
      const lastReset = new Date(usage.lastReset);
      const now = new Date();
      if (now.toDateString() !== lastReset.toDateString()) {
        usage.read = 0;
        usage.write = 0;
        usage.lastReset = now.toISOString();
        await this.saveUsage(usage);
      }

      return usage;
    } catch (error) {
      // Initialize usage file if it doesn't exist
      const initialUsage: TwitterUsage = {
        read: 0,
        write: 0,
        lastReset: new Date().toISOString(),
        dailyLimit: {
          read: 100,  // Conservative limit
          write: 50   // Conservative limit
        }
      };
      await this.saveUsage(initialUsage);
      return initialUsage;
    }
  }

  private async saveUsage(usage: TwitterUsage): Promise<void> {
    await fs.mkdir(path.dirname(this.usageFile), { recursive: true });
    await fs.writeFile(this.usageFile, JSON.stringify(usage, null, 2));
  }

  private async trackUsage(type: 'read' | 'write'): Promise<void> {
    const usage = await this.getUsage();
    usage[type]++;
    await this.saveUsage(usage);
  }

  private async checkRateLimit(type: 'read' | 'write'): Promise<boolean> {
    const usage = await this.getUsage();
    return usage[type] < usage.dailyLimit[type];
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

      // Save tweet data
      const tweetData: TweetData = {
        id: response.data.id,
        text,
        createdAt: new Date().toISOString(),
        replyToId
      };

      await this.saveTweetData(tweetData);

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
        'tweet.fields': ['created_at', 'author_id', 'in_reply_to_user_id']
      });

      await this.trackUsage('read');

      if (!response.data) {
        return null;
      }

      return {
        id: response.data.id,
        text: response.data.text,
        createdAt: response.data.created_at || new Date().toISOString(),
        authorId: response.data.author_id
      };
    } catch (error) {
      console.error('Failed to get tweet:', error);
      throw new Error(`Failed to get tweet: ${error}`);
    }
  }

  private async saveTweetData(tweet: TweetData): Promise<void> {
    const tweetsDir = path.join(process.cwd(), 'data', 'tweets');
    await fs.mkdir(tweetsDir, { recursive: true });

    const filename = path.join(tweetsDir, `${tweet.id}.json`);
    await fs.writeFile(filename, JSON.stringify(tweet, null, 2));
  }

  async getUsageStats(): Promise<TwitterUsage> {
    return await this.getUsage();
  }

  async searchTweets(query: string, maxResults: number = 10): Promise<TweetData[]> {
    if (!await this.checkRateLimit('read')) {
      throw new Error('Daily read limit exceeded');
    }

    try {
      const client = this.initializeClient();
      const response = await client.v2.search(query, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'author_id']
      });

      await this.trackUsage('read');

      return response.data?.data?.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at || new Date().toISOString(),
        authorId: tweet.author_id
      })) || [];
    } catch (error) {
      console.error('Failed to search tweets:', error);
      throw new Error(`Failed to search tweets: ${error}`);
    }
  }
}

export const twitterClient = new TwitterClient();