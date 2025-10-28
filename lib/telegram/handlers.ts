import TelegramBot from 'node-telegram-bot-api';
import { db } from '../services/database';
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

// Helper function to get or create Telegram conversation
async function getOrCreateTelegramConversation(
  chatId: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  // Try to find existing conversation
  const existing = await db.getConversationByPlatformId('telegram', chatId);
  if (existing) {
    return existing.id;
  }

  // Create new conversation
  return await db.createConversation(
    'telegram',
    chatId,
    metadata?.userId,
    {
      ...metadata,
      chatType: 'telegram',
      createdAt: new Date().toISOString()
    }
  );
}

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

    // Get or create conversation in database
    const chatIdStr = chatId.toString();
    let conversationId = await getOrCreateTelegramConversation(chatIdStr, {
      command: 'ask',
      userId: msg.from?.id?.toString(),
      username: msg.from?.username,
      firstName: msg.from?.first_name
    });

    if (!conversationId) {
      throw new Error('Failed to create conversation');
    }

    // Add user message to database
    await db.addMessage(conversationId, 'user', question, {
      messageId: msg.message_id,
      userId: msg.from?.id,
      username: msg.from?.username
    });

    // Create conversation object for AI generation (legacy format)
    const conversation = {
      id: conversationId,
      platform: 'telegram' as const,
      platformId: chatIdStr,
      messages: [{
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: question,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    // Generate AI response
    const response = await generateResponse(conversation);
    await db.trackUsage('gemini', 'generate', 1);

    // Add AI response to database
    await db.addMessage(conversationId, 'assistant', response);

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

    // Get or create conversation in database
    const chatIdStr = chatId.toString();
    let conversationId = await getOrCreateTelegramConversation(chatIdStr, {
      type: 'direct_message',
      userId: msg.from?.id?.toString(),
      username: msg.from?.username,
      firstName: msg.from?.first_name
    });

    if (!conversationId) {
      throw new Error('Failed to create conversation');
    }

    // Add user message to database
    await db.addMessage(conversationId, 'user', text, {
      messageId: msg.message_id,
      userId: msg.from?.id,
      username: msg.from?.username
    });

    // Get recent messages for context (up to 10 messages)
    const recentMessages = await db.getMessages(conversationId, 10);

    // Create conversation object for AI generation with recent context
    const conversation = {
      id: conversationId,
      platform: 'telegram' as const,
      platformId: chatIdStr,
      messages: recentMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      })),
      createdAt: new Date().toISOString()
    };

    // Generate AI response
    const response = await generateResponse(conversation);
    await db.trackUsage('gemini', 'generate', 1);

    // Add AI response to database
    await db.addMessage(conversationId, 'assistant', response);

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

    // Get or create conversation in database
    const chatIdStr = chatId.toString();
    let conversationId = await getOrCreateTelegramConversation(chatIdStr, {
      type: 'group_mention',
      userId: msg.from?.id?.toString(),
      username: msg.from?.username,
      firstName: msg.from?.first_name,
      chatType: msg.chat.type,
      chatTitle: msg.chat.title
    });

    if (!conversationId) {
      throw new Error('Failed to create conversation');
    }

    // Prepare user message content
    const userMessage = `${msg.from?.first_name || 'someone'} mentioned you in a group: ${cleanedText}`;

    // Add user message to database
    await db.addMessage(conversationId, 'user', userMessage, {
      messageId: msg.message_id,
      userId: msg.from?.id,
      username: msg.from?.username,
      originalText: text,
      cleanedText: cleanedText
    });

    // Get recent messages for context (up to 5 for group chats)
    const recentMessages = await db.getMessages(conversationId, 5);

    // Create conversation object for AI generation with recent context
    const conversation = {
      id: conversationId,
      platform: 'telegram' as const,
      platformId: chatIdStr,
      messages: recentMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      })),
      createdAt: new Date().toISOString()
    };

    // Generate AI response
    const response = await generateResponse(conversation);
    await db.trackUsage('gemini', 'generate', 1);

    // Add AI response to database
    await db.addMessage(conversationId, 'assistant', response, {
      replyToMessageId: msg.message_id
    });

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