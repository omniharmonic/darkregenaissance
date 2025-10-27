#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { twitterMonitor } from '../lib/twitter/monitor';
import getBot from '../lib/telegram/bot';

console.log('🌲 Dark Regenaissance Monitoring Network Starting...');
console.log('🍄 Connecting to the mycelial web...');

async function startMonitoringServices() {
  try {
    // Start Twitter monitoring
    console.log('🐦 Initializing Twitter monitoring...');
    await twitterMonitor.start();

    // Start Telegram bot
    console.log('📱 Initializing Telegram bot...');
    const bot = getBot();
    console.log('✅ Telegram bot connected');

    console.log('');
    console.log('🌐 === Dark Regenaissance Network Status ===');
    console.log('🐦 Twitter: Monitoring mentions, accounts, and posting daily insights');
    console.log('📱 Telegram: Responding to commands and mentions in groups');
    console.log('⏰ Daily tweets scheduled');
    console.log('🔄 Auto-reply system active');
    console.log('');
    console.log('🌲 The mycelial network is fully operational');
    console.log('🍄 Underground connections established');
    console.log('');
    console.log('Press Ctrl+C to disconnect from the network');

  } catch (error) {
    console.error('❌ Error starting monitoring services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🍄 Disconnecting from the mycelial network...');
  console.log('⏹️ Stopping Twitter monitor...');
  twitterMonitor.stop();
  console.log('✅ Network connections closed');
  console.log('🌲 The underground whispers fade to silence...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🍄 Network termination signal received...');
  twitterMonitor.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception in mycelial network:', error);
  twitterMonitor.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection in underground network:', reason);
  twitterMonitor.stop();
  process.exit(1);
});

// Start the monitoring network
startMonitoringServices();