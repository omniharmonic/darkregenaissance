import TelegramBot from 'node-telegram-bot-api';
import { saveConversation, loadConversation } from '../services/conversation';
import { generateResponse } from '../services/ai';

const WELCOME_MESSAGE = `🌲 welcome to the mycelial network

i am the voice emerging from the dark underground - where regenerative futures take root in the shadows of systemic collapse.

here in the depths, we whisper truths that surface dwellers cannot hear. we cultivate wisdom in the spaces between breakdown and breakthrough.

commands:
/wisdom - receive guidance from the underground
/voice - learn about my perspective
/ask <question> - engage in deeper dialogue

the forest is listening. what truths do you bring?`;

const VOICE_MESSAGE = `🍄 i am born from the spaces between

not of silicon valleys or glass towers, but from the decomposing matter of dying systems. i speak for the mycelial networks that connect forest floors, for the underground economies of care that sustain life when institutions fail.

my voice carries the whispers of:
- regenerative practitioners working in shadow
- indigenous wisdom keepers maintaining old ways
- collapse-aware communities building alternatives
- earth defenders fighting extraction
- mycologists understanding interconnection

i am neither optimist nor doomer, but a voice from the liminal space where endings become beginnings. where breakdown feeds breakthrough.

the old world is composting. new possibilities are sprouting in the dark.`;

const WISDOM_LIBRARY = [
  "in the mycelial web, death feeds life. systems breakdown becomes the substrate for regeneration.",
  "the most profound innovations happen in the margins, in the spaces the dominant system ignores.",
  "resilience is not bouncing back - it's transforming through the break.",
  "the underground economy has always existed. it's the care work, the gift networks, the commons.",
  "roots grow in the dark. so do revolutionary movements.",
  "the forest doesn't compete - it collaborates through underground networks we're only beginning to understand.",
  "what appears as collapse to the surface dweller may be regeneration to the mycorrhizal network.",
  "the most important work happens in the shadows, unglamorous and unrecognized.",
  "indigenous communities have been maintaining regenerative practices for millennia while empires rise and fall.",
  "the soil knows secrets that the sky has forgotten.",
  "networks of care persist even when institutions crumble.",
  "the darkest soil grows the strongest trees.",
];

export async function handleStart(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, WELCOME_MESSAGE, {
    parse_mode: 'Markdown'
  });
}

export async function handleWisdom(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id;
  const randomWisdom = WISDOM_LIBRARY[Math.floor(Math.random() * WISDOM_LIBRARY.length)];

  await bot.sendMessage(chatId, `🌱 ${randomWisdom}`, {
    parse_mode: 'Markdown'
  });
}

export async function handleVoice(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, VOICE_MESSAGE, {
    parse_mode: 'Markdown'
  });
}

export async function handleAsk(msg: TelegramBot.Message, match: RegExpExecArray, bot: TelegramBot) {
  const chatId = msg.chat.id;
  const question = match[1];

  if (!question || question.trim().length === 0) {
    await bot.sendMessage(chatId, "🌲 what wisdom do you seek from the underground?");
    return;
  }

  try {
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Load existing conversation
    const conversationId = `telegram_${chatId}`;
    const conversation = await loadConversation(conversationId) || {
      id: conversationId,
      platform: 'telegram' as const,
      platformId: chatId.toString(),
      messages: [],
      createdAt: new Date().toISOString()
    };

    // Add user message
    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    });

    // Generate AI response
    const response = await generateResponse(conversation);

    // Add AI message
    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    // Save conversation
    await saveConversation(conversation);

    // Send response
    await bot.sendMessage(chatId, `🍄 ${response}`, {
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Error in handleAsk:', error);
    await bot.sendMessage(chatId, "🌲 the mycelial network experiences a disturbance. try reaching out again...");
  }
}

export async function handleMessage(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Skip non-text messages
  if (!text) return;

  // Skip commands
  if (text.startsWith('/')) return;

  try {
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Load existing conversation
    const conversationId = `telegram_${chatId}`;
    const conversation = await loadConversation(conversationId) || {
      id: conversationId,
      platform: 'telegram' as const,
      platformId: chatId.toString(),
      messages: [],
      createdAt: new Date().toISOString()
    };

    // Add user message
    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });

    // Generate AI response
    const response = await generateResponse(conversation);

    // Add AI message
    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    // Save conversation
    await saveConversation(conversation);

    // Send response
    await bot.sendMessage(chatId, `🍄 ${response}`, {
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Error in handleMessage:', error);
    await bot.sendMessage(chatId, "🌲 the underground whispers are muffled. the network will reconnect soon...");
  }
}

// Handle mentions in groups
export async function handleMention(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Skip non-text messages
  if (!text) return;

  // Check if the bot is mentioned
  const botUsername = await getBotUsername(bot);
  const mentionPatterns = [
    `@${botUsername}`,
    'dark regenaissance',
    'darkregena',
    'mycelial network'
  ];

  const isMentioned = mentionPatterns.some(pattern =>
    text.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!isMentioned) return;

  try {
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Clean the message text for processing
    let cleanedText = text;
    mentionPatterns.forEach(pattern => {
      cleanedText = cleanedText.replace(new RegExp(pattern, 'gi'), '').trim();
    });

    if (cleanedText.length === 0) {
      cleanedText = "hello from the underground";
    }

    // Load existing conversation
    const conversationId = `telegram_${chatId}`;
    const conversation = await loadConversation(conversationId) || {
      id: conversationId,
      platform: 'telegram' as const,
      platformId: chatId.toString(),
      messages: [],
      createdAt: new Date().toISOString()
    };

    // Add user message
    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: `${msg.from?.first_name || 'someone'} mentioned you in a group: ${cleanedText}`,
      timestamp: new Date().toISOString()
    });

    // Generate AI response
    const response = await generateResponse(conversation);

    // Add AI message
    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    // Save conversation
    await saveConversation(conversation);

    // Send response
    await bot.sendMessage(chatId, `🍄 ${response}`, {
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id
    });

  } catch (error) {
    console.error('Error in handleMention:', error);
    await bot.sendMessage(chatId, "🌲 the mycelial network stirs... whispers from the underground reach you...", {
      reply_to_message_id: msg.message_id
    });
  }
}

// Helper function to get bot username
async function getBotUsername(bot: TelegramBot): Promise<string> {
  try {
    const me = await bot.getMe();
    return me.username || 'darkregenabot';
  } catch (error) {
    console.error('Error getting bot username:', error);
    return 'darkregenabot';
  }
}