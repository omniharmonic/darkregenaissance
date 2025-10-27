#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { twitterMonitor } from '../lib/twitter/monitor';

async function checkMentions() {
  try {
    console.log('🔍 Checking for mentions...');

    // Load config and check mentions once
    await twitterMonitor.loadConfig();
    await twitterMonitor.checkMentions();

    console.log('✅ Mention check completed');

  } catch (error) {
    console.error('❌ Error checking mentions:', error);
    process.exit(1);
  }
}

// Run the check
checkMentions();