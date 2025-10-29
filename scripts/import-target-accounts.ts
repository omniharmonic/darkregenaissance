#!/usr/bin/env tsx
/**
 * Import target accounts from JSON config into Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map priority numbers to tiers
function mapPriorityToTier(priority: number): 'critical' | 'high' | 'medium' | 'low' {
  switch (priority) {
    case 5: return 'critical';
    case 4: return 'high';
    case 3: return 'medium';
    case 2: return 'medium';
    case 1: return 'low';
    default: return 'medium';
  }
}

async function importAccounts() {
  console.log('🔄 Importing target accounts...\n');

  // Read the JSON file
  const configPath = path.join(process.cwd(), 'data', 'target-accounts-config.json');
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const accountsToInsert: Array<{
    username: string;
    priority: string;
    category: string;
    strategy: object;
    is_active: boolean;
  }> = [];

  // Process each category
  for (const category of configData.categories) {
    for (const account of category.accounts) {
      if (account.hasValidHandle) {
        accountsToInsert.push({
          username: account.handle,
          priority: mapPriorityToTier(category.priority),
          category: category.name,
          strategy: {
            responseStrategy: category.responseStrategy,
            priority: category.priority,
            notes: account.notes || ''
          },
          is_active: true
        });
      }
    }
  }

  console.log(`📊 Found ${accountsToInsert.length} accounts to import\n`);

  // Clear existing accounts first (optional)
  const { error: deleteError } = await supabase
    .from('twitter_accounts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.log('⚠️  Note: Could not clear existing accounts:', deleteError.message);
  } else {
    console.log('✅ Cleared existing accounts\n');
  }

  // Remove duplicates by username (keep first occurrence)
  const uniqueAccounts = accountsToInsert.reduce((acc, account) => {
    if (!acc.find(a => a.username === account.username)) {
      acc.push(account);
    }
    return acc;
  }, [] as typeof accountsToInsert);

  console.log(`📊 After deduplication: ${uniqueAccounts.length} unique accounts\n`);

  // Insert accounts in batches using UPSERT
  const batchSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < uniqueAccounts.length; i += batchSize) {
    const batch = uniqueAccounts.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('twitter_accounts')
      .upsert(batch, {
        onConflict: 'username',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      imported += data?.length || 0;
      console.log(`✅ Imported batch ${i / batchSize + 1}: ${data?.length || 0} accounts`);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Successfully imported: ${imported} accounts`);
  if (errors > 0) {
    console.log(`   ❌ Failed: ${errors} accounts`);
  }

  // Show breakdown by priority
  const { data: stats } = await supabase
    .from('twitter_accounts')
    .select('priority')
    .order('priority', { ascending: true });

  if (stats) {
    const breakdown = stats.reduce((acc, { priority }) => {
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🎯 Priority Breakdown:');
    console.log(`   🔴 Critical: ${breakdown.critical || 0} accounts`);
    console.log(`   🟠 High: ${breakdown.high || 0} accounts`);
    console.log(`   🟡 Medium: ${breakdown.medium || 0} accounts`);
    console.log(`   🟢 Low: ${breakdown.low || 0} accounts`);
  }

  console.log('\n✨ Import complete! Refresh your admin dashboard to see all accounts.\n');
}

importAccounts().catch(console.error);

