'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: string;
  created_at: string;
}

interface Conversation {
  id: string;
  platform: string;
  started_at: string;
  last_message: string;
  message_count: number;
  messages: Message[];
  metadata?: Record<string, unknown>;
}

export default function ConversationsTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformFilter]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/conversations?platform=${platformFilter}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'web': return '🌐';
      case 'telegram': return '✈️';
      default: return '💬';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitter': return 'bg-blue-500/20 text-blue-400';
      case 'web': return 'bg-purple-500/20 text-purple-400';
      case 'telegram': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="mr-2">💬</span>
          Conversations Manager
        </h2>
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Platform Filter */}
      <div className="flex space-x-2">
        {['all', 'twitter', 'web', 'telegram'].map(platform => (
          <button
            key={platform}
            onClick={() => setPlatformFilter(platform)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              platformFilter === platform
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {platform === 'all' ? '📊 All' : getPlatformIcon(platform) + ' ' + platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading conversations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">No conversations found</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`bg-slate-800/50 border rounded-lg p-4 cursor-pointer transition-all hover:border-emerald-500 ${
                    selectedConv?.id === conv.id ? 'border-emerald-500 bg-slate-800' : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPlatformColor(conv.platform)}`}>
                      {getPlatformIcon(conv.platform)} {conv.platform}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(conv.last_message).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium mb-1">
                    {conv.messages[0]?.content.substring(0, 60) || 'No messages'}...
                  </p>
                  <p className="text-xs text-slate-400">
                    {conv.message_count} message{conv.message_count !== 1 ? 's' : ''}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Conversation Detail */}
          <div className="lg:col-span-2">
            {selectedConv ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <span className="mr-2">{getPlatformIcon(selectedConv.platform)}</span>
                      Conversation Details
                    </h3>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getPlatformColor(selectedConv.platform)}`}>
                      {selectedConv.platform}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Started</p>
                      <p className="text-white">{new Date(selectedConv.started_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Last Activity</p>
                      <p className="text-white">{new Date(selectedConv.last_message).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {selectedConv.messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`p-4 rounded-lg ${
                        msg.role === 'assistant'
                          ? 'bg-emerald-900/20 border border-emerald-700/30 ml-8'
                          : 'bg-slate-900/50 border border-slate-700 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${
                          msg.role === 'assistant' ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                          {msg.role === 'assistant' ? '🤖 Bot' : '👤 User'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {selectedConv.metadata && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Metadata</p>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedConv.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                <p className="text-slate-400 text-lg">Select a conversation to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

