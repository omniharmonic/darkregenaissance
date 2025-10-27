const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testAI() {
  const { generateInsight } = await import('./lib/services/ai.js');

  try {
    console.log('🍄 Testing AI generation...');
    const insight = await generateInsight();
    console.log('✅ Generated insight:', insight);
  } catch (error) {
    console.error('❌ AI generation failed:', error.message);
  }
}

testAI();