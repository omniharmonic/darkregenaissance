#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

interface TargetAccount {
  name: string;
  handle: string; // Without @ symbol
  category: string;
  notes: string;
  hasValidHandle: boolean;
}

interface AccountCategory {
  name: string;
  accounts: TargetAccount[];
  priority: number; // 1-5, 5 being highest priority
  responseStrategy: 'aggressive' | 'moderate' | 'conservative' | 'minimal';
}

async function parseTargetAccountsCSV(): Promise<TargetAccount[]> {
  const csvPath = path.join(process.cwd(), '.claude', 'dark_regenasense_targets_extended.csv');

  try {
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // Skip header row
    const dataLines = lines.slice(1);

    const accounts: TargetAccount[] = [];

    for (const line of dataLines) {
      const [name, handle, category, notes] = line.split(',').map(s => s.trim());

      if (!name || !category) continue;

      // Extract handle from various formats (@handle, handle, N/A, etc.)
      let cleanHandle = '';
      let hasValidHandle = false;

      if (handle && handle !== 'N/A' && handle !== '') {
        cleanHandle = handle.replace('@', '').trim();
        hasValidHandle = cleanHandle.length > 0;
      }

      accounts.push({
        name: name,
        handle: cleanHandle,
        category: category,
        notes: notes || '',
        hasValidHandle
      });
    }

    return accounts;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}

function categorizeAccounts(accounts: TargetAccount[]): AccountCategory[] {
  const categories: Record<string, AccountCategory> = {};

  for (const account of accounts) {
    if (!account.hasValidHandle) continue; // Skip accounts without valid Twitter handles

    const categoryName = account.category;

    if (!categories[categoryName]) {
      categories[categoryName] = {
        name: categoryName,
        accounts: [],
        priority: getPriorityForCategory(categoryName),
        responseStrategy: getResponseStrategyForCategory(categoryName)
      };
    }

    categories[categoryName].accounts.push(account);
  }

  return Object.values(categories).sort((a, b) => b.priority - a.priority);
}

function getPriorityForCategory(category: string): number {
  const priorityMap: Record<string, number> = {
    'AI Research': 5,
    'AI Research / Ethics': 5,
    'AI Acceleration': 5,
    'AI Acceleration / Tech CEO': 5,
    'VC / Accelerationist': 4,
    'Tech CEO': 4,
    'Cultural Amplifier': 4,
    'Cultural Bridge': 3,
    'VC / Cultural Bridge': 3,
    'VC / Cultural': 3,
    'AI Ethics': 3,
    'AI Safety Organization': 3,
    'Tech Ethics': 2,
    'Corporate Greenwashing': 1,
    'Corporate Greenwashing / Climate': 1,
    'Corporate Greenwashing / Tech': 1,
    'Financial Corporation': 1,
    'Consulting Corporation': 1
  };

  return priorityMap[category] || 2;
}

function getResponseStrategyForCategory(category: string): 'aggressive' | 'moderate' | 'conservative' | 'minimal' {
  // High engagement with AI thought leaders
  if (category.includes('AI Research') || category.includes('AI Acceleration')) {
    return 'aggressive';
  }

  // Moderate engagement with VCs and cultural figures
  if (category.includes('VC') || category.includes('Cultural')) {
    return 'moderate';
  }

  // Conservative with ethics/safety folks (respectful disagreement)
  if (category.includes('Ethics') || category.includes('Safety')) {
    return 'conservative';
  }

  // Minimal engagement with corporate greenwashing
  if (category.includes('Greenwashing') || category.includes('Financial') || category.includes('Consulting')) {
    return 'minimal';
  }

  return 'moderate';
}

async function generateAccountConfig(categories: AccountCategory[]): Promise<void> {
  const config = {
    lastUpdated: new Date().toISOString(),
    totalAccounts: categories.reduce((sum, cat) => sum + cat.accounts.length, 0),
    totalValidHandles: categories.reduce((sum, cat) => sum + cat.accounts.filter(a => a.hasValidHandle).length, 0),
    categories: categories,
    batchSettings: {
      highPriorityInterval: 30, // minutes
      mediumPriorityInterval: 60, // minutes
      lowPriorityInterval: 120, // minutes
      maxTweetsPerBatch: 10,
      maxAPICallsPerHour: 30 // Conservative limit
    }
  };

  const configPath = path.join(process.cwd(), 'data', 'target-accounts-config.json');
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  console.log(`📊 Generated config with ${config.totalValidHandles} accounts across ${categories.length} categories`);
  console.log(`💾 Saved to: ${configPath}`);
}

async function main() {
  try {
    console.log('📈 Parsing target accounts CSV...');
    const accounts = await parseTargetAccountsCSV();

    console.log(`📋 Parsed ${accounts.length} total accounts`);
    console.log(`✅ ${accounts.filter(a => a.hasValidHandle).length} accounts have valid Twitter handles`);
    console.log(`❌ ${accounts.filter(a => !a.hasValidHandle).length} accounts missing handles`);

    console.log('\n🏷️ Categorizing accounts...');
    const categories = categorizeAccounts(accounts);

    console.log('\n📊 Account Categories:');
    for (const category of categories) {
      console.log(`  ${category.name}: ${category.accounts.length} accounts (Priority: ${category.priority}, Strategy: ${category.responseStrategy})`);
    }

    console.log('\n💾 Generating configuration file...');
    await generateAccountConfig(categories);

    console.log('\n🎯 Top Priority Accounts:');
    const topAccounts = categories
      .filter(cat => cat.priority >= 4)
      .flatMap(cat => cat.accounts)
      .slice(0, 10);

    for (const account of topAccounts) {
      console.log(`  @${account.handle} - ${account.name} (${account.category})`);
    }

    console.log('\n✅ Account parsing complete!');

  } catch (error) {
    console.error('❌ Failed to parse accounts:', error);
    process.exit(1);
  }
}

main().catch(console.error);