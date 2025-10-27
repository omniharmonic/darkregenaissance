import TelegramBot from 'node-telegram-bot-api';
import { handleStart, handleWisdom, handleVoice, handleAsk, handleMessage, handleMention } from './handlers';

let botInstance: TelegramBot | null = null;

function initializeBot(): TelegramBot {
  if (botInstance) return botInstance;

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN not found in environment variables');
  }

  botInstance = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: process.env.NODE_ENV !== 'production'
  });

  setupHandlers(botInstance);
  return botInstance;
}

function setupHandlers(bot: TelegramBot) {

  // Command handlers
  bot.onText(/\/start/, (msg) => handleStart(msg, bot));
  bot.onText(/\/wisdom/, (msg) => handleWisdom(msg, bot));
  bot.onText(/\/voice/, (msg) => handleVoice(msg, bot));
  bot.onText(/\/ask (.+)/, (msg, match) => handleAsk(msg, match!, bot));

  // Handle regular messages (not commands)
  bot.on('message', async (msg) => {
    // Skip if message is a command
    if (msg.text?.startsWith('/')) {
      return;
    }

    // Check for mentions first (in groups)
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
      await handleMention(msg, bot);
    } else {
      // Handle as regular message in private chat
      await handleMessage(msg, bot);
    }
  });

  // Error handling
  bot.on('error', (error) => {
    console.error('Telegram bot error:', error);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Stopping Telegram bot...');
    bot.stopPolling();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Stopping Telegram bot...');
    bot.stopPolling();
    process.exit(0);
  });
}

export function getBot(): TelegramBot {
  return initializeBot();
}

export default getBot;