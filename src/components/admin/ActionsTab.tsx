'use client';

import { useState } from 'react';

interface ActionResult {
  success: boolean;
  output?: string;
  error?: string;
  message?: string;
}

export default function ActionsTab() {
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [tweetContent, setTweetContent] = useState('');
  const [replyTweetId, setReplyTweetId] = useState('');
  const [replyContent, setReplyContent] = useState('');

  const executeAction = async (action: string, params?: Record<string, string>) => {
    setExecuting(action);
    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params })
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, [action]: result }));
      
      if (result.success) {
        // Clear form if action was successful
        if (action === 'post-tweet') setTweetContent('');
        if (action === 'reply-tweet') {
          setReplyTweetId('');
          setReplyContent('');
        }
      }
    } catch {
      setResults(prev => ({
        ...prev,
        [action]: { success: false, error: 'Connection error' }
      }));
    } finally {
      setExecuting(null);
    }
  };

  const ActionButton = ({ action, label, icon, description, disabled = false }: {
    action: string;
    label: string;
    icon: string;
    description: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => executeAction(action)}
      disabled={executing === action || disabled}
      className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-6 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {executing === action && (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent"></div>
        )}
      </div>
      <h4 className="text-white font-bold mb-1">{label}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
      {results[action] && (
        <div className={`mt-3 p-2 rounded text-xs ${
          results[action].success
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {results[action].success ? '✓ Success' : '✗ Failed'}
          {results[action].message && <p className="mt-1">{results[action].message}</p>}
          {results[action].error && <p className="mt-1">{results[action].error}</p>}
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center mb-2">
          <span className="mr-2">⚡</span>
          Manual Actions
        </h2>
        <p className="text-slate-400">Trigger bot actions and system operations manually</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionButton
            action="check-mentions"
            label="Check Mentions"
            icon="🔍"
            description="Manually check for new Twitter mentions and respond"
          />
          <ActionButton
            action="test-health"
            label="Health Check"
            icon="💚"
            description="Run a complete system health check"
          />
          <ActionButton
            action="clear-cache"
            label="Clear Cache"
            icon="🗑️"
            description="Clear all in-memory caches"
          />
          <ActionButton
            action="monitor-start"
            label="Start Monitor"
            icon="▶️"
            description="Start the account monitoring service"
          />
          <ActionButton
            action="monitor-stop"
            label="Stop Monitor"
            icon="⏸️"
            description="Stop the account monitoring service"
          />
          <ActionButton
            action="test-telegram"
            label="Test Telegram"
            icon="✈️"
            description="Test Telegram bot connection"
          />
        </div>
      </div>

      {/* Post Tweet */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <span className="mr-2">📝</span>
          Post New Tweet
        </h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (tweetContent.trim()) {
            executeAction('post-tweet', { content: tweetContent });
          }
        }} className="space-y-4">
          <div>
            <textarea
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={280}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${
                tweetContent.length > 280 ? 'text-red-400' : 'text-slate-400'
              }`}>
                {tweetContent.length} / 280
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!tweetContent.trim() || tweetContent.length > 280 || executing === 'post-tweet'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {executing === 'post-tweet' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <span>🐦</span>
                <span>Post Tweet</span>
              </>
            )}
          </button>
          {results['post-tweet'] && (
            <div className={`p-4 rounded-lg ${
              results['post-tweet'].success
                ? 'bg-green-500/20 border border-green-700 text-green-400'
                : 'bg-red-500/20 border border-red-700 text-red-400'
            }`}>
              {results['post-tweet'].success ? '✓ Tweet posted successfully!' : '✗ Failed to post tweet'}
              {results['post-tweet'].error && <p className="text-sm mt-2">{results['post-tweet'].error}</p>}
            </div>
          )}
        </form>
      </div>

      {/* Reply to Tweet */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <span className="mr-2">💬</span>
          Reply to Tweet
        </h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (replyTweetId.trim() && replyContent.trim()) {
            executeAction('reply-tweet', {
              tweetId: replyTweetId,
              content: replyContent
            });
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tweet ID or URL
            </label>
            <input
              type="text"
              value={replyTweetId}
              onChange={(e) => setReplyTweetId(e.target.value)}
              placeholder="1234567890123456789 or https://twitter.com/..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reply Content
            </label>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Your reply..."
              rows={4}
              maxLength={280}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${
                replyContent.length > 280 ? 'text-red-400' : 'text-slate-400'
              }`}>
                {replyContent.length} / 280
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!replyTweetId.trim() || !replyContent.trim() || replyContent.length > 280 || executing === 'reply-tweet'}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {executing === 'reply-tweet' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Replying...</span>
              </>
            ) : (
              <>
                <span>💬</span>
                <span>Send Reply</span>
              </>
            )}
          </button>
          {results['reply-tweet'] && (
            <div className={`p-4 rounded-lg ${
              results['reply-tweet'].success
                ? 'bg-green-500/20 border border-green-700 text-green-400'
                : 'bg-red-500/20 border border-red-700 text-red-400'
            }`}>
              {results['reply-tweet'].success ? '✓ Reply sent successfully!' : '✗ Failed to send reply'}
              {results['reply-tweet'].error && <p className="text-sm mt-2">{results['reply-tweet'].error}</p>}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

