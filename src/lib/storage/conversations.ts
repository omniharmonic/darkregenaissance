import fs from 'fs/promises';
import path from 'path';

// Use /tmp directory in serverless environments (Vercel), otherwise use local data directory
const DATA_DIR = process.env.VERCEL 
  ? path.join('/tmp', 'data')
  : path.join(process.cwd(), 'data');

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens?: number;
}

export interface Conversation {
  id: string;
  platform: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export async function saveConversation(
  platform: string,
  conversationId: string,
  messages: Message[]
): Promise<void> {
  const dir = path.join(DATA_DIR, 'conversations', platform);
  await fs.mkdir(dir, { recursive: true });

  const filepath = path.join(dir, `${conversationId}.json`);
  const conversation: Conversation = {
    id: conversationId,
    platform,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages
  };

  await fs.writeFile(filepath, JSON.stringify(conversation, null, 2));
}

export async function loadConversation(
  platform: string,
  conversationId: string
): Promise<Conversation | null> {
  const filepath = path.join(
    DATA_DIR,
    'conversations',
    platform,
    `${conversationId}.json`
  );

  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null; // Conversation doesn't exist yet
  }
}

export async function updateConversation(
  platform: string,
  conversationId: string,
  messages: Message[]
): Promise<void> {
  const existing = await loadConversation(platform, conversationId);
  if (!existing) {
    await saveConversation(platform, conversationId, messages);
    return;
  }

  existing.messages = messages;
  existing.updated_at = new Date().toISOString();

  const filepath = path.join(
    DATA_DIR,
    'conversations',
    platform,
    `${conversationId}.json`
  );

  await fs.writeFile(filepath, JSON.stringify(existing, null, 2));
}