import { twitterClient, type TweetData } from './client';
import { generateResponse } from '../services/ai';
import { db } from '../services/database';
import { targetAccountMonitor } from './account-monitor';
import fs from 'fs/promises';
import path from 'path';

export interface MonitorConfig {
  watchedAccounts: string[];
  mentionKeywords: string[];
  dailyTweetTimes: string[]; // Array of HH:MM format times
  maxResponsesPerHour: number;
}

export interface MentionEvent {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  processed: boolean;
}

class TwitterMonitor {
  private config: MonitorConfig;
  private lastMentionId: string | null = null;
  private configFile: string;
  private mentionsFile: string;
  private isRunning: boolean = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.configFile = path.join(process.cwd(), 'data', 'twitter', 'monitor-config.json');
    this.mentionsFile = path.join(process.cwd(), 'data', 'twitter', 'mentions.json');
    this.config = {
      watchedAccounts: [],
      mentionKeywords: ['@darkregenaI', 'dark regenaissance', 'mycelial'],
      dailyTweetTimes: ['09:00', '15:00', '21:00'], // 3 times per day
      maxResponsesPerHour: 5
    };
  }

  async loadConfig(): Promise<void> {
    try {
      const data = await fs.readFile(this.configFile, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(data) };
    } catch {
      // Use default config if file doesn't exist
      await this.saveConfig();
    }
  }

  async saveConfig(): Promise<void> {
    await fs.mkdir(path.dirname(this.configFile), { recursive: true });
    await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2));
  }

  async updateWatchedAccounts(accounts: string[]): Promise<void> {
    this.config.watchedAccounts = accounts;
    await this.saveConfig();
  }

  // Database-based mention tracking replaces file-based system
  async isInteractionProcessed(tweetId: string): Promise<boolean> {
    return await db.isInteractionProcessed('twitter', tweetId);
  }

  async recordInteraction(tweet: TweetData, type: 'mention' | 'watch' = 'mention'): Promise<void> {
    await db.recordInteraction(
      'twitter',
      tweet.id,
      type,
      tweet.authorId,
      {
        text: tweet.text,
        createdAt: tweet.createdAt,
        source: 'twitter_monitor'
      }
    );
  }

  async checkMentions(): Promise<void> {
    try {
      console.log('🔍 Checking for mentions...');

      // Check rate limits
      const canRead = await db.checkUsageLimit('twitter', 'read', 100);
      if (!canRead) {
        console.log('⏰ Twitter read limit reached for today');
        return;
      }

      // Use single search query to avoid rate limiting (Twitter free API: 1 search per 15 minutes)
      const primaryQuery = '@darkregenaI';

      try {
        const tweets = await twitterClient.searchTweets(primaryQuery, 10);
        await db.trackUsage('twitter', 'read', 1);

        for (const tweet of tweets) {
          // Check if we've already processed this tweet
          const alreadyProcessed = await this.isInteractionProcessed(tweet.id);

          if (alreadyProcessed) {
            console.log(`⏭️ Tweet ${tweet.id} already processed, skipping`);
            continue;
          }

          // Record the new interaction
          await this.recordInteraction(tweet, 'mention');

          console.log(`📢 New mention found: ${tweet.text.slice(0, 100)}...`);
          await this.respondToMention(tweet);
        }
      } catch (searchError: unknown) {
        const error = searchError as { message?: string; code?: number };
        if (error.message?.includes('429') || error.code === 429) {
          console.log('⏰ Rate limit reached - will try again in 15 minutes');
          return; // Gracefully exit on rate limit
        }
        throw searchError; // Re-throw other errors
      }

    } catch (error) {
      console.error('Error checking mentions:', error);
    }
  }

  async respondToMention(tweet: TweetData): Promise<void> {
    try {
      // Check rate limiting
      const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
      if (!canWrite) {
        console.log('⏱️ Twitter write limit reached, skipping response');
        return;
      }

      // Get full thread context for better AI responses
      console.log('🧵 Getting thread context for mention...');
      const threadContext = await twitterClient.getThreadContext(tweet.id, 10);

      console.log(`📝 Thread context includes ${threadContext.threadTweets.length} tweets`);
      if (threadContext.threadTweets.length > 1) {
        console.log(`🔍 Full context: ${threadContext.totalContext.slice(0, 200)}...`);
      }

      // Create conversation in database
      const conversationId = await db.createConversation(
        'twitter',
        tweet.id,
        tweet.authorId,
        {
          tweetText: tweet.text,
          tweetCreatedAt: tweet.createdAt,
          threadContext: threadContext.totalContext,
          threadLength: threadContext.threadTweets.length,
          source: 'twitter_monitor'
        }
      );

      if (!conversationId) {
        throw new Error('Failed to create conversation in database');
      }

      // Add user message to conversation (include thread context)
      await db.addMessage(conversationId, 'user', threadContext.totalContext, {
        tweetId: tweet.id,
        authorId: tweet.authorId,
        originalTweet: tweet.text,
        threadLength: threadContext.threadTweets.length
      });

      // Create conversation context for AI generation with full thread context
      const conversation = {
        id: conversationId,
        platform: 'twitter' as const,
        platformId: tweet.id,
        messages: [{
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: threadContext.threadTweets.length > 1
            ? `Thread context:\n${threadContext.totalContext}\n\nI was mentioned in the last tweet. Please respond appropriately to the conversation.`
            : tweet.text,
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
      };

      // Generate AI response
      const response = await generateResponse(conversation);
      await db.trackUsage('gemini', 'generate', 1);

      // Post reply
      const replyId = await twitterClient.postTweet(response, tweet.id);
      await db.trackUsage('twitter', 'write', 1);

      console.log(`✅ Replied to mention: ${replyId}`);

      // Add assistant message to conversation
      await db.addMessage(conversationId, 'assistant', response, {
        replyTweetId: replyId
      });

      // Mark interaction as processed
      await db.markInteractionProcessed('twitter', tweet.id, conversationId);

    } catch (error) {
      console.error('Error responding to mention:', error);
      // Mark as processed to avoid retry loops
      await db.markInteractionProcessed('twitter', tweet.id);
    }
  }

  async checkWatchedAccounts(): Promise<void> {
    try {
      console.log('👀 Checking watched accounts...');

      for (const username of this.config.watchedAccounts) {
        // Search for recent tweets from this user
        const tweets = await twitterClient.searchTweets(`from:${username}`, 5);

        for (const tweet of tweets) {
          // Check if we should respond to this tweet
          if (await this.shouldRespondToAccount(tweet)) {
            await this.respondToAccountTweet(tweet);
          }
        }
      }
    } catch (error) {
      console.error('Error checking watched accounts:', error);
    }
  }

  private async shouldRespondToAccount(tweet: TweetData): Promise<boolean> {
    // Don't respond to very old tweets (more than 24 hours)
    const tweetTime = new Date(tweet.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - tweetTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) return false;

    // Check if we already processed this interaction
    const alreadyProcessed = await this.isInteractionProcessed(tweet.id);
    return !alreadyProcessed;
  }

  private async respondToAccountTweet(tweet: TweetData): Promise<void> {
    try {
      // Check rate limiting
      const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
      if (!canWrite) {
        console.log('⏱️ Twitter write limit reached, skipping account response');
        return;
      }

      // Record the interaction
      await this.recordInteraction(tweet, 'watch');

      // Create conversation in database
      const conversationId = await db.createConversation(
        'twitter',
        tweet.id,
        tweet.authorId,
        {
          tweetText: tweet.text,
          tweetCreatedAt: tweet.createdAt,
          source: 'watched_account'
        }
      );

      if (!conversationId) {
        throw new Error('Failed to create conversation in database');
      }

      // Add user message to conversation
      const userMessage = `Responding to ${tweet.authorId}: ${tweet.text}`;
      await db.addMessage(conversationId, 'user', userMessage, {
        tweetId: tweet.id,
        authorId: tweet.authorId,
        originalText: tweet.text
      });

      // Create conversation context for AI generation
      const conversation = {
        id: conversationId,
        platform: 'twitter' as const,
        platformId: tweet.id,
        messages: [{
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: userMessage,
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
      };

      // Generate contextual response
      const response = await generateResponse(conversation);
      await db.trackUsage('gemini', 'generate', 1);

      // Post reply
      const replyId = await twitterClient.postTweet(response, tweet.id);
      await db.trackUsage('twitter', 'write', 1);

      console.log(`✅ Replied to watched account tweet: ${replyId}`);

      // Add assistant message to conversation
      await db.addMessage(conversationId, 'assistant', response, {
        replyTweetId: replyId
      });

      // Mark interaction as processed
      await db.markInteractionProcessed('twitter', tweet.id, conversationId);

    } catch (error) {
      console.error('Error responding to account tweet:', error);
      // Mark as processed to avoid retry loops
      await db.markInteractionProcessed('twitter', tweet.id);
    }
  }

  // Rate limiting is now handled by database-based usage tracking

  async postDailyTweet(): Promise<void> {
    try {
      console.log('🌅 Posting daily tweet...');

      // Check write limits
      const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
      if (!canWrite) {
        console.log('⏰ Twitter write limit reached, skipping daily tweet');
        return;
      }

      // Generate daily insight
      const { generateInsight } = await import('../services/ai');
      const insight = await generateInsight();
      await db.trackUsage('gemini', 'generate', 1);

      // Post the tweet
      const tweetId = await twitterClient.postTweet(insight);
      await db.trackUsage('twitter', 'write', 1);

      console.log(`✅ Daily tweet posted: ${tweetId}`);

      // Record this as a proactive post
      await db.recordInteraction(
        'twitter',
        tweetId,
        'post',
        undefined,
        {
          content: insight,
          type: 'daily_insight',
          source: 'scheduled_post'
        }
      );

    } catch (error) {
      console.error('Error posting daily tweet:', error);
    }
  }

  private scheduleDailyTweets(): void {
    // Schedule all daily tweet times
    this.config.dailyTweetTimes.forEach((timeStr) => {
      this.scheduleNextTweetAtTime(timeStr);
    });
  }

  private scheduleNextTweetAtTime(timeStr: string): void {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilPost = scheduledTime.getTime() - now.getTime();

    console.log(`⏰ Daily tweet scheduled for: ${scheduledTime.toISOString()} (${timeStr})`);

    const timeout = setTimeout(async () => {
      await this.postDailyTweet();
      // Schedule the next occurrence (24 hours later)
      this.scheduleNextTweetAtTime(timeStr);
    }, timeUntilPost);

    this.intervals.push(timeout);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Monitor is already running');
      return;
    }

    this.isRunning = true;
    await this.loadConfig();

    console.log('🚀 Starting Twitter monitor...');
    console.log(`📊 Config: ${JSON.stringify(this.config, null, 2)}`);

    // Start target account monitoring system
    console.log('🎯 Starting target account monitor...');
    await targetAccountMonitor.start();

    // Check mentions every 15 minutes (max rate for free tier)
    const mentionInterval = setInterval(async () => {
      await this.checkMentions();
    }, 15 * 60 * 1000);

    // Legacy watched accounts (now replaced by target account monitor)
    // const accountInterval = setInterval(async () => {
    //   await this.checkWatchedAccounts();
    // }, 30 * 60 * 1000);

    this.intervals.push(mentionInterval);
    // this.intervals.push(accountInterval);

    // Schedule daily tweets
    this.scheduleDailyTweets();

    // Do initial checks
    await this.checkMentions();
    // Legacy: if (this.config.watchedAccounts.length > 0) {
    //   await this.checkWatchedAccounts();
    // }
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('⏹️ Stopping Twitter monitor...');

    // Stop target account monitor
    targetAccountMonitor.stop();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
  }

  getConfig(): MonitorConfig {
    return { ...this.config };
  }
}

export const twitterMonitor = new TwitterMonitor();