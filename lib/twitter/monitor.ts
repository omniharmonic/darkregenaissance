import { twitterClient, type TweetData } from './client';
import { generateResponse } from '../services/ai';
import { type Conversation } from '../services/conversation';
import fs from 'fs/promises';
import path from 'path';

export interface MonitorConfig {
  watchedAccounts: string[];
  mentionKeywords: string[];
  dailyTweetTime: string; // HH:MM format
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
      dailyTweetTime: '09:00',
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

  async loadMentions(): Promise<MentionEvent[]> {
    try {
      const data = await fs.readFile(this.mentionsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveMentions(mentions: MentionEvent[]): Promise<void> {
    await fs.mkdir(path.dirname(this.mentionsFile), { recursive: true });
    await fs.writeFile(this.mentionsFile, JSON.stringify(mentions, null, 2));
  }

  async checkMentions(): Promise<void> {
    try {
      console.log('🔍 Checking for mentions...');

      // Search for mentions using various patterns
      const searchQueries = [
        '@darkregenaI',
        'dark regenaissance',
        ...this.config.mentionKeywords
      ];

      for (const query of searchQueries) {
        const tweets = await twitterClient.searchTweets(query, 10);

        for (const tweet of tweets) {
          if (this.lastMentionId && tweet.id <= this.lastMentionId) {
            continue; // Skip already processed tweets
          }

          const mentions = await this.loadMentions();
          const existing = mentions.find(m => m.id === tweet.id);

          if (!existing) {
            const mention: MentionEvent = {
              id: tweet.id,
              authorId: tweet.authorId || 'unknown',
              text: tweet.text,
              createdAt: tweet.createdAt,
              processed: false
            };

            mentions.push(mention);
            await this.saveMentions(mentions);

            console.log(`📢 New mention found: ${tweet.text.slice(0, 100)}...`);
            await this.respondToMention(mention);
          }
        }
      }

      // Update last checked mention ID
      const allMentions = await this.loadMentions();
      if (allMentions.length > 0) {
        this.lastMentionId = Math.max(...allMentions.map(m => parseInt(m.id))).toString();
      }

    } catch (error) {
      console.error('Error checking mentions:', error);
    }
  }

  async respondToMention(mention: MentionEvent): Promise<void> {
    try {
      // Check rate limiting
      if (!await this.canRespond()) {
        console.log('⏱️ Rate limit reached, skipping response');
        return;
      }

      // Create conversation context
      const conversationId = `twitter_mention_${mention.id}`;
      const conversation: Conversation = {
        id: conversationId,
        platform: 'twitter',
        platformId: mention.id,
        messages: [{
          id: crypto.randomUUID(),
          role: 'user',
          content: mention.text,
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
      };

      // Generate AI response
      const response = await generateResponse(conversation);

      // Post reply
      const replyId = await twitterClient.postTweet(response, mention.id);
      console.log(`✅ Replied to mention: ${replyId}`);

      // Mark as processed
      const mentions = await this.loadMentions();
      const mentionIndex = mentions.findIndex(m => m.id === mention.id);
      if (mentionIndex !== -1) {
        mentions[mentionIndex].processed = true;
        await this.saveMentions(mentions);
      }

    } catch (error) {
      console.error('Error responding to mention:', error);
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

    // Check if we already responded
    const mentions = await this.loadMentions();
    const alreadyProcessed = mentions.find(m => m.id === tweet.id);

    return !alreadyProcessed;
  }

  private async respondToAccountTweet(tweet: TweetData): Promise<void> {
    try {
      if (!await this.canRespond()) {
        console.log('⏱️ Rate limit reached, skipping account response');
        return;
      }

      // Create conversation context
      const conversationId = `twitter_watch_${tweet.id}`;
      const conversation: Conversation = {
        id: conversationId,
        platform: 'twitter',
        platformId: tweet.id,
        messages: [{
          id: crypto.randomUUID(),
          role: 'user',
          content: `Responding to ${tweet.authorId}: ${tweet.text}`,
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
      };

      // Generate contextual response
      const response = await generateResponse(conversation);

      // Post reply
      const replyId = await twitterClient.postTweet(response, tweet.id);
      console.log(`✅ Replied to watched account tweet: ${replyId}`);

      // Track this interaction
      const mentions = await this.loadMentions();
      mentions.push({
        id: tweet.id,
        authorId: tweet.authorId || 'unknown',
        text: tweet.text,
        createdAt: tweet.createdAt,
        processed: true
      });
      await this.saveMentions(mentions);

    } catch (error) {
      console.error('Error responding to account tweet:', error);
    }
  }

  private async canRespond(): Promise<boolean> {
    // Check hourly rate limit
    const mentions = await this.loadMentions();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentResponses = mentions.filter(m =>
      m.processed && new Date(m.createdAt) > oneHourAgo
    );

    return recentResponses.length < this.config.maxResponsesPerHour;
  }

  async postDailyTweet(): Promise<void> {
    try {
      console.log('🌅 Posting daily tweet...');

      // Generate daily insight
      const { generateInsight } = await import('../services/ai');
      const insight = await generateInsight();

      // Post the tweet
      const tweetId = await twitterClient.postTweet(insight);
      console.log(`✅ Daily tweet posted: ${tweetId}`);

    } catch (error) {
      console.error('Error posting daily tweet:', error);
    }
  }

  private scheduleNextDailyTweet(): void {
    const [hours, minutes] = this.config.dailyTweetTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilPost = scheduledTime.getTime() - now.getTime();

    console.log(`⏰ Next daily tweet scheduled for: ${scheduledTime.toISOString()}`);

    const timeout = setTimeout(async () => {
      await this.postDailyTweet();
      this.scheduleNextDailyTweet(); // Schedule the next one
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

    // Check mentions every 5 minutes
    const mentionInterval = setInterval(async () => {
      await this.checkMentions();
    }, 5 * 60 * 1000);

    // Check watched accounts every 10 minutes
    const accountInterval = setInterval(async () => {
      await this.checkWatchedAccounts();
    }, 10 * 60 * 1000);

    this.intervals.push(mentionInterval);
    this.intervals.push(accountInterval);

    // Schedule daily tweets
    this.scheduleNextDailyTweet();

    // Do initial checks
    await this.checkMentions();
    if (this.config.watchedAccounts.length > 0) {
      await this.checkWatchedAccounts();
    }
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('⏹️ Stopping Twitter monitor...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
  }

  getConfig(): MonitorConfig {
    return { ...this.config };
  }
}

export const twitterMonitor = new TwitterMonitor();