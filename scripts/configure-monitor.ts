#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { twitterMonitor } from '../lib/twitter/monitor';

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  await twitterMonitor.loadConfig();

  switch (command) {
    case 'add-account':
      if (args.length === 0) {
        console.log('Usage: npm run configure -- add-account <username1> [username2] ...');
        console.log('Example: npm run configure -- add-account elonmusk vitalikbuterin');
        return;
      }

      const currentConfig = twitterMonitor.getConfig();
      const newAccounts = [...new Set([...currentConfig.watchedAccounts, ...args])];
      await twitterMonitor.updateWatchedAccounts(newAccounts);
      console.log('✅ Updated watched accounts:', newAccounts);
      break;

    case 'remove-account':
      if (args.length === 0) {
        console.log('Usage: npm run configure -- remove-account <username>');
        return;
      }

      const configToUpdate = twitterMonitor.getConfig();
      const filteredAccounts = configToUpdate.watchedAccounts.filter(
        account => !args.includes(account)
      );
      await twitterMonitor.updateWatchedAccounts(filteredAccounts);
      console.log('✅ Updated watched accounts:', filteredAccounts);
      break;

    case 'list-accounts':
      const config = twitterMonitor.getConfig();
      console.log('📊 Current Configuration:');
      console.log('');
      console.log('👀 Watched Accounts:', config.watchedAccounts);
      console.log('🔍 Mention Keywords:', config.mentionKeywords);
      console.log('⏰ Daily Tweet Time:', config.dailyTweetTime);
      console.log('⚡ Max Responses/Hour:', config.maxResponsesPerHour);
      break;

    case 'set-daily-time':
      if (args.length === 0) {
        console.log('Usage: npm run configure -- set-daily-time <HH:MM>');
        console.log('Example: npm run configure -- set-daily-time 09:30');
        return;
      }

      const timeMatch = args[0].match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) {
        console.log('❌ Invalid time format. Use HH:MM (e.g., 09:30)');
        return;
      }

      const currentConf = twitterMonitor.getConfig();
      const newConfig = { ...currentConf, dailyTweetTime: args[0] };
      await twitterMonitor.saveConfig();
      console.log('✅ Daily tweet time set to:', args[0]);
      break;

    case 'test-mention-check':
      console.log('🔍 Testing mention detection...');
      await twitterMonitor.checkMentions();
      console.log('✅ Mention check completed');
      break;

    case 'test-daily-tweet':
      console.log('🌅 Testing daily tweet posting...');
      await twitterMonitor.postDailyTweet();
      console.log('✅ Daily tweet posted');
      break;

    default:
      console.log('🌲 Dark Regenaissance Monitor Configuration');
      console.log('');
      console.log('Available commands:');
      console.log('  add-account <username>     - Add Twitter account to watch');
      console.log('  remove-account <username>  - Remove watched account');
      console.log('  list-accounts             - Show current configuration');
      console.log('  set-daily-time <HH:MM>    - Set daily tweet time');
      console.log('  test-mention-check        - Test mention detection');
      console.log('  test-daily-tweet          - Post a daily tweet now');
      console.log('');
      console.log('Examples:');
      console.log('  npm run configure -- add-account elonmusk');
      console.log('  npm run configure -- set-daily-time 09:00');
      console.log('  npm run configure -- list-accounts');
      break;
  }
}

main().catch(console.error);