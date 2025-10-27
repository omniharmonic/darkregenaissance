#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import getBot from '../lib/telegram/bot';

// Initialize the bot
const bot = getBot();

console.log('🤖 Dark Regenaissance Telegram bot started');
console.log('🌲 The mycelial network is listening...');
console.log('');
console.log('Bot commands:');
console.log('  /start    - Initialize bot');
console.log('  /wisdom   - Get random insight');
console.log('  /voice    - Learn about the bot');
console.log('  /ask      - Ask a question');
console.log('');
console.log('Press Ctrl+C to stop the bot');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🍄 Shutting down the underground network...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🍄 Shutting down the underground network...');
  process.exit(0);
});