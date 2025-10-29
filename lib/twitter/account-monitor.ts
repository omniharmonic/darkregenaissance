import { twitterClient, type TweetData } from './client';
import { generateResponse } from '../services/ai';
import { db } from '../services/database';
import fs from 'fs/promises';
import path from 'path';

interface TargetAccount {
  name: string;
  handle: string;
  category: string;
  notes: string;
  hasValidHandle: boolean;
}

interface AccountCategory {
  name: string;
  accounts: TargetAccount[];
  priority: number;
  responseStrategy: 'aggressive' | 'moderate' | 'conservative' | 'minimal';
}

interface MonitoringConfig {
  lastUpdated: string;
  totalAccounts: number;
  totalValidHandles: number;
  categories: AccountCategory[];
  batchSettings: {
    highPriorityInterval: number;
    mediumPriorityInterval: number;
    lowPriorityInterval: number;
    maxTweetsPerBatch: number;
    maxAPICallsPerHour: number;
  };
}

interface AccountBatch {
  accounts: TargetAccount[];
  priority: number;
  intervalMinutes: number;
  lastChecked?: string;
}

class TargetAccountMonitor {
  private config: MonitoringConfig | null = null;
  private batches: AccountBatch[] = [];
  private isRunning: boolean = false;
  private intervals: NodeJS.Timeout[] = [];

  async loadConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'data', 'target-accounts-config.json');
      const data = await fs.readFile(configPath, 'utf-8');
      this.config = JSON.parse(data) as MonitoringConfig;
      this.createBatches();
    } catch (error) {
      console.error('Failed to load target accounts config:', error);
      throw error;
    }
  }

  private createBatches(): void {
    if (!this.config) return;

    this.batches = [];
    const prioritizedCategories = this.config.categories.sort((a, b) => b.priority - a.priority);

    for (const category of prioritizedCategories) {
      const accounts = category.accounts.filter(acc => acc.hasValidHandle);
      if (accounts.length === 0) continue;

      // Determine batch size and interval based on priority
      let batchSize: number;
      let intervalMinutes: number;

      if (category.priority >= 5) {
        batchSize = 3; // High priority: smaller batches, more frequent
        intervalMinutes = this.config.batchSettings.highPriorityInterval;
      } else if (category.priority >= 4) {
        batchSize = 5; // Medium priority
        intervalMinutes = this.config.batchSettings.mediumPriorityInterval;
      } else if (category.priority >= 3) {
        batchSize = 6; // Lower medium priority
        intervalMinutes = this.config.batchSettings.lowPriorityInterval;
      } else {
        batchSize = 10; // Low priority: larger batches, less frequent
        intervalMinutes = this.config.batchSettings.lowPriorityInterval * 2;
      }

      // Split accounts into batches
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batchAccounts = accounts.slice(i, i + batchSize);
        this.batches.push({
          accounts: batchAccounts,
          priority: category.priority,
          intervalMinutes: intervalMinutes
        });
      }
    }

    console.log(`📊 Created ${this.batches.length} monitoring batches`);
    console.log(`🎯 Priority distribution: ${this.batches.filter(b => b.priority >= 5).length} high, ${this.batches.filter(b => b.priority === 4).length} medium, ${this.batches.filter(b => b.priority < 4).length} low`);
  }

  async monitorBatch(batch: AccountBatch): Promise<void> {
    try {
      const handles = batch.accounts.map(acc => acc.handle);
      console.log(`🔍 Monitoring batch: ${handles.join(', ')} (Priority ${batch.priority})`);

      // Check rate limits
      const canRead = await db.checkUsageLimit('twitter', 'read', 100);
      if (!canRead) {
        console.log('⏰ Twitter read limit reached, skipping batch');
        return;
      }

      // Create batched query
      const query = handles.map(handle => `from:${handle}`).join(' OR ');
      const timeFilter = ' -is:retweet'; // Exclude retweets for quality
      const fullQuery = `(${query})${timeFilter}`;

      console.log(`🔎 Search query: ${fullQuery}`);

      // Search for recent tweets
      const tweets = await twitterClient.searchTweets(fullQuery, 50);
      await db.trackUsage('twitter', 'read', 1);

      console.log(`📋 Found ${tweets.length} tweets from batch`);

      // Process each tweet
      for (const tweet of tweets) {
        await this.processTweetFromTargetAccount(tweet, batch);
      }

      // Update last checked time
      batch.lastChecked = new Date().toISOString();

    } catch (error) {
      console.error(`Error monitoring batch:`, error);
    }
  }

  private async processTweetFromTargetAccount(tweet: TweetData, batch: AccountBatch): Promise<void> {
    try {
      // Find the account this tweet belongs to
      const account = batch.accounts.find(acc =>
        tweet.authorId && acc.handle.toLowerCase() === tweet.authorId.toLowerCase()
      );

      if (!account) {
        console.log(`⚠️ Could not find account for tweet ${tweet.id}`);
        return;
      }

      // Check if we already processed this tweet
      const alreadyProcessed = await db.isInteractionProcessed('twitter', tweet.id);
      if (alreadyProcessed) {
        console.log(`⏭️ Tweet ${tweet.id} already processed`);
        return;
      }

      // Apply intelligent filtering
      if (!await this.shouldRespondToTweet(tweet, account)) {
        console.log(`🚫 Filtered out tweet ${tweet.id} from @${account.handle}`);
        // Still record it as processed to avoid re-processing
        await db.recordInteraction('twitter', tweet.id, 'filtered', tweet.authorId, {
          reason: 'filtered_by_criteria',
          accountName: account.name,
          accountCategory: account.category
        });
        return;
      }

      console.log(`✅ Responding to tweet from @${account.handle}: "${tweet.text.slice(0, 100)}..."`);
      await this.respondToTargetAccountTweet(tweet, account);

    } catch (error) {
      console.error(`Error processing tweet ${tweet.id}:`, error);
    }
  }

  private async shouldRespondToTweet(tweet: TweetData, account: TargetAccount): Promise<boolean> {
    // 1. Recency check (only tweets from last 24 hours)
    const tweetTime = new Date(tweet.createdAt);
    const now = new Date();
    const hoursAgo = (now.getTime() - tweetTime.getTime()) / (1000 * 60 * 60);

    if (hoursAgo > 24) {
      console.log(`⏰ Tweet too old: ${hoursAgo.toFixed(1)} hours ago`);
      return false;
    }

    // 2. Content quality filters
    const text = tweet.text.toLowerCase();

    // Skip very short tweets (likely not substantial)
    if (text.length < 50) {
      console.log(`📏 Tweet too short: ${text.length} characters`);
      return false;
    }

    // Skip if it's mostly links or mentions
    const linkCount = (text.match(/https?:\/\//g) || []).length;
    const mentionCount = (text.match(/@\w+/g) || []).length;
    if (linkCount > 2 || mentionCount > 3) {
      console.log(`🔗 Too many links/mentions: ${linkCount} links, ${mentionCount} mentions`);
      return false;
    }

    // 3. Relevance filters - look for AI/tech/philosophy keywords
    const relevantKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'neural', 'llm',
      'technology', 'innovation', 'future', 'automation', 'robots',
      'consciousness', 'philosophy', 'ethics', 'society', 'humanity',
      'progress', 'evolution', 'transformation', 'disruption', 'breakthrough'
    ];

    const hasRelevantKeywords = relevantKeywords.some(keyword =>
      text.includes(keyword.toLowerCase())
    );

    // 4. Apply response probability based on account priority and content
    let responseChance = 0;

    if (account.category.includes('AI Research') || account.category.includes('AI Acceleration')) {
      responseChance = hasRelevantKeywords ? 0.8 : 0.4;
    } else if (account.category.includes('VC') || account.category.includes('Tech CEO')) {
      responseChance = hasRelevantKeywords ? 0.6 : 0.2;
    } else if (account.category.includes('Ethics') || account.category.includes('Safety')) {
      responseChance = hasRelevantKeywords ? 0.4 : 0.1;
    } else {
      responseChance = hasRelevantKeywords ? 0.3 : 0.05;
    }

    // 5. Random selection based on calculated probability
    const shouldRespond = Math.random() < responseChance;

    console.log(`🎲 Response decision for @${account.handle}: ${Math.round(responseChance * 100)}% chance, ${shouldRespond ? 'RESPONDING' : 'SKIPPING'}`);

    return shouldRespond;
  }

  private async respondToTargetAccountTweet(tweet: TweetData, account: TargetAccount): Promise<void> {
    try {
      // Check write limits
      const canWrite = await db.checkUsageLimit('twitter', 'write', 50);
      if (!canWrite) {
        console.log('⏱️ Twitter write limit reached, skipping response');
        return;
      }

      // Get thread context for better responses
      const threadContext = await twitterClient.getThreadContext(tweet.id, 5);

      // Record the interaction
      await db.recordInteraction('twitter', tweet.id, 'target_account_response', tweet.authorId, {
        accountName: account.name,
        accountCategory: account.category,
        accountNotes: account.notes,
        threadLength: threadContext.threadTweets.length
      });

      // Create conversation in database
      const conversationId = await db.createConversation(
        'twitter',
        tweet.id,
        tweet.authorId,
        {
          tweetText: tweet.text,
          tweetCreatedAt: tweet.createdAt,
          threadContext: threadContext.totalContext,
          targetAccount: account.name,
          accountCategory: account.category,
          responseStrategy: this.getResponseStrategyForAccount(account),
          source: 'target_account_monitor'
        }
      );

      if (!conversationId) {
        throw new Error('Failed to create conversation in database');
      }

      // Add user message to conversation
      const contextualMessage = threadContext.threadTweets.length > 1
        ? `Target account @${account.handle} (${account.name}) posted in thread:\n${threadContext.totalContext}`
        : `Target account @${account.handle} (${account.name}) posted: ${tweet.text}`;

      await db.addMessage(conversationId, 'user', contextualMessage, {
        tweetId: tweet.id,
        authorId: tweet.authorId,
        targetAccount: account.name,
        accountCategory: account.category
      });

      // Generate contextual response based on account type
      const responsePrompt = this.generateResponsePrompt(account, threadContext);
      const conversation = {
        id: conversationId,
        platform: 'twitter' as const,
        platformId: tweet.id,
        messages: [{
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: responsePrompt,
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
      };

      const response = await generateResponse(conversation);
      await db.trackUsage('gemini', 'generate', 1);

      // Post reply
      const replyId = await twitterClient.postTweet(response, tweet.id);
      await db.trackUsage('twitter', 'write', 1);

      console.log(`✅ Replied to @${account.handle}: ${replyId}`);
      console.log(`📝 Response: "${response}"`);

      // Add assistant message to conversation
      await db.addMessage(conversationId, 'assistant', response, {
        replyTweetId: replyId,
        targetAccount: account.name
      });

      // Mark interaction as processed
      await db.markInteractionProcessed('twitter', tweet.id, conversationId);

    } catch (error) {
      console.error(`Error responding to target account tweet:`, error);
      // Mark as processed to avoid retry loops
      await db.markInteractionProcessed('twitter', tweet.id);
    }
  }

  private getResponseStrategyForAccount(account: TargetAccount): string {
    // Find the category for this account to get response strategy
    if (!this.config) return 'moderate';

    const category = this.config.categories.find(cat =>
      cat.accounts.some(acc => acc.handle === account.handle)
    );

    return category?.responseStrategy || 'moderate';
  }

  private generateResponsePrompt(account: TargetAccount, threadContext: any): string {
    const strategy = this.getResponseStrategyForAccount(account);
    const baseContext = threadContext.threadTweets.length > 1
      ? `Thread context from @${account.handle}:\n${threadContext.totalContext}`
      : `Tweet from @${account.handle}: ${threadContext.currentTweet.text}`;

    const strategyInstructions = {
      'aggressive': 'Engage boldly and substantively with their ideas. Show deep understanding and offer compelling perspectives.',
      'moderate': 'Engage thoughtfully and respectfully. Find common ground while adding valuable insights.',
      'conservative': 'Engage carefully and respectfully. Focus on understanding their perspective and asking thoughtful questions.',
      'minimal': 'Engage minimally and only if the content is exceptionally relevant to our mission.'
    };

    return `${baseContext}\n\nThis is from ${account.name} (${account.category}). ${account.notes}\n\nResponse strategy: ${strategy}\nInstructions: ${strategyInstructions[strategy] || strategyInstructions.moderate}\n\nRespond appropriately to their post.`;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Target account monitor is already running');
      return;
    }

    await this.loadConfig();
    if (!this.config) {
      throw new Error('Failed to load configuration');
    }

    this.isRunning = true;
    console.log(`🚀 Starting target account monitor with ${this.batches.length} batches`);

    // Schedule each batch based on its priority and interval
    for (let i = 0; i < this.batches.length; i++) {
      const batch = this.batches[i];

      // Stagger initial checks to spread API usage
      const initialDelay = i * 5 * 1000; // 5 seconds between each batch start

      setTimeout(() => {
        // Do initial check
        this.monitorBatch(batch);

        // Schedule recurring checks
        const interval = setInterval(() => {
          this.monitorBatch(batch);
        }, batch.intervalMinutes * 60 * 1000);

        this.intervals.push(interval);
      }, initialDelay);
    }

    console.log(`📅 Scheduled ${this.batches.length} monitoring batches`);
  }

  stop(): void {
    if (!this.isRunning) return;

    console.log('⏹️ Stopping target account monitor...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
  }

  getStatus(): {
    running: boolean;
    batchCount: number;
    accountCount: number;
    nextChecks: string[];
  } {
    return {
      running: this.isRunning,
      batchCount: this.batches.length,
      accountCount: this.batches.reduce((sum, batch) => sum + batch.accounts.length, 0),
      nextChecks: this.batches.slice(0, 5).map(batch =>
        batch.accounts.map(acc => acc.handle).join(', ')
      )
    };
  }
}

export const targetAccountMonitor = new TargetAccountMonitor();