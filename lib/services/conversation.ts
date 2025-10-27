import fs from 'fs/promises';
import path from 'path';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  platform: 'web' | 'telegram' | 'twitter';
  platformId?: string;
  messages: Message[];
  createdAt: string;
}

const getConversationPath = (conversationId: string, platform: 'web' | 'telegram' = 'web') => {
  return path.join(process.cwd(), 'data', 'conversations', platform, `${conversationId}.json`);
};

export async function saveConversation(conversation: Conversation): Promise<void> {
  const filePath = getConversationPath(conversation.id, conversation.platform);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
}

export async function loadConversation(conversationId: string, platform: 'web' | 'telegram' = 'web'): Promise<Conversation | null> {
  try {
    const filePath = getConversationPath(conversationId, platform);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as Conversation;
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

export async function listConversations(platform: 'web' | 'telegram' = 'web'): Promise<Conversation[]> {
  try {
    const conversationsDir = path.join(process.cwd(), 'data', 'conversations', platform);
    const files = await fs.readdir(conversationsDir);

    const conversations: Conversation[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(conversationsDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const conversation = JSON.parse(data) as Conversation;
          conversations.push(conversation);
        } catch (error) {
          console.error(`Failed to load conversation ${file}:`, error);
        }
      }
    }

    // Sort by creation date (newest first)
    return conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    // Directory doesn't exist yet
    return [];
  }
}

export async function deleteConversation(conversationId: string, platform: 'web' | 'telegram' = 'web'): Promise<boolean> {
  try {
    const filePath = getConversationPath(conversationId, platform);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getConversationStats(platform?: 'web' | 'telegram'): Promise<{
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  platforms: Record<string, number>;
}> {
  const platforms = platform ? [platform] : ['web', 'telegram'];
  let totalConversations = 0;
  let totalMessages = 0;
  const platformCounts: Record<string, number> = {};

  for (const p of platforms) {
    const conversations = await listConversations(p as 'web' | 'telegram');
    totalConversations += conversations.length;
    platformCounts[p] = conversations.length;

    for (const conversation of conversations) {
      totalMessages += conversation.messages.length;
    }
  }

  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
    platforms: platformCounts
  };
}