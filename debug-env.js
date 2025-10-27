const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('TWITTER_API_KEY:', process.env.TWITTER_API_KEY ? 'Found' : 'Missing');
console.log('TWITTER_API_SECRET:', process.env.TWITTER_API_SECRET ? 'Found' : 'Missing');
console.log('TWITTER_ACCESS_TOKEN:', process.env.TWITTER_ACCESS_TOKEN ? 'Found' : 'Missing');
console.log('TWITTER_ACCESS_SECRET:', process.env.TWITTER_ACCESS_SECRET ? 'Found' : 'Missing');
console.log('TWITTER_BEARER_TOKEN:', process.env.TWITTER_BEARER_TOKEN ? 'Found' : 'Missing');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Found' : 'Missing');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Found' : 'Missing');

console.log('\nTwitter env vars:', Object.keys(process.env).filter(k => k.includes('TWITTER')));