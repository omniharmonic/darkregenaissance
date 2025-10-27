import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateInsight } from './lib/services/ai';

async function testAI() {
  try {
    console.log('🍄 Testing AI generation...');
    const insight = await generateInsight();
    console.log('✅ Generated insight:', insight);
  } catch (error) {
    console.error('❌ AI generation failed:', error);
  }
}

testAI();