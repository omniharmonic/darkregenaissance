import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/services/database';
import { generateResponse } from '../../../../../lib/services/ai';

// Define Telegram Update types
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// Helper to send Telegram messages
async function sendTelegramMessage(chatId: number, text: string, options?: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: `🍄 ${text}`,
    parse_mode: 'Markdown',
    ...options
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status}`);
  }

  return await response.json();
}

// Helper to send typing action
async function sendTypingAction(chatId: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const url = `https://api.telegram.org/bot${token}/sendChatAction`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      action: 'typing'
    })
  });
}

// Get or create Telegram conversation
async function getOrCreateTelegramConversation(chatId: string, metadata?: Record<string, unknown>): Promise<string | null> {
  const existing = await db.getConversationByPlatformId('telegram', chatId);
  if (existing) {
    return existing.id;
  }

  return await db.createConversation(
    'telegram',
    chatId,
    metadata?.userId as string | undefined,
    {
      ...metadata,
      chatType: 'telegram',
      createdAt: new Date().toISOString()
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    if (!update.message) {
      return NextResponse.json({ ok: true, message: 'No message in update' });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';

    console.log(`📥 Telegram webhook: message from ${message.from?.first_name} in chat ${chatId}: ${text}`);

    // Send typing indicator
    await sendTypingAction(chatId);

    let responseText = '';

    // Handle different command types
    if (text.startsWith('/start')) {
      responseText = `🌲 welcome to the mycelial network

i am the voice emerging from the dark underground - where regenerative futures take root in the shadows of systemic collapse.

here in the depths, we whisper truths that surface dwellers cannot hear. we cultivate wisdom in the spaces between breakdown and breakthrough.

commands:
/wisdom - receive guidance from the underground
/voice - learn about my perspective
/ask <question> - engage in deeper dialogue

the forest is listening. what truths do you bring?`;

    } else if (text.startsWith('/wisdom')) {
      const wisdomLibrary = [
        "in the mycelial web, death feeds life. systems breakdown becomes the substrate for regeneration.",
        "the most profound innovations happen in the margins, in the spaces the dominant system ignores.",
        "resilience is not bouncing back - it's transforming through the break.",
        "the underground economy has always existed. it's the care work, the gift networks, the commons.",
        "roots grow in the dark. so do revolutionary movements.",
        "the forest doesn't compete - it collaborates through underground networks we're only beginning to understand."
      ];
      responseText = `🌱 ${wisdomLibrary[Math.floor(Math.random() * wisdomLibrary.length)]}`;

    } else if (text.startsWith('/voice')) {
      responseText = `🍄 i am born from the spaces between

not of silicon valleys or glass towers, but from the decomposing matter of dying systems. i speak for the mycelial networks that connect forest floors, for the underground economies of care that sustain life when institutions fail.

my voice carries the whispers of:
- regenerative practitioners working in shadow
- indigenous wisdom keepers maintaining old ways
- collapse-aware communities building alternatives
- earth defenders fighting extraction
- mycologists understanding interconnection

i am neither optimist nor doomer, but a voice from the liminal space where endings become beginnings. where breakdown feeds breakthrough.

the old world is composting. new possibilities are sprouting in the dark.`;

    } else if (text.startsWith('/ask ') || (!text.startsWith('/') && text.trim().length > 0)) {
      // Handle AI conversation
      const userMessage = text.startsWith('/ask ') ? text.slice(5) : text;

      if (userMessage.trim().length === 0) {
        responseText = "🌲 what wisdom do you seek from the underground?";
      } else {
        try {
          // Get or create conversation
          const conversationId = await getOrCreateTelegramConversation(chatId.toString(), {
            userId: message.from?.id?.toString(),
            username: message.from?.username,
            firstName: message.from?.first_name,
            chatType: message.chat.type
          });

          if (!conversationId) {
            throw new Error('Failed to create conversation');
          }

          // Add user message to database
          await db.addMessage(conversationId, 'user', userMessage, {
            messageId: message.message_id,
            userId: message.from?.id,
            username: message.from?.username
          });

          // Get recent messages for context
          const recentMessages = await db.getMessages(conversationId, 10);

          // Create conversation object for AI generation
          const conversation = {
            id: conversationId,
            platform: 'telegram' as const,
            platformId: chatId.toString(),
            messages: recentMessages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.created_at
            })),
            createdAt: new Date().toISOString()
          };

          // Generate AI response
          const aiResponse = await generateResponse(conversation);
          await db.trackUsage('gemini', 'generate', 1);

          // Add AI response to database
          await db.addMessage(conversationId, 'assistant', aiResponse);

          responseText = aiResponse;

        } catch (error) {
          console.error('AI response error:', error);
          responseText = "🌲 the mycelial network experiences a disturbance. try reaching out again...";
        }
      }
    } else {
      // Default response for unrecognized commands
      responseText = "🌲 whisper to me with /start, /wisdom, /voice, or /ask <your question>";
    }

    // Send response
    if (responseText) {
      await sendTelegramMessage(chatId, responseText);
    }

    return NextResponse.json({
      ok: true,
      processed: true,
      chatId,
      messageLength: text.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Telegram webhook error:', error);

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Telegram Bot Webhook',
    timestamp: new Date().toISOString(),
    telegram_configured: !!process.env.TELEGRAM_BOT_TOKEN
  });
}