'use client';

import { useState, useEffect } from 'react';

interface Analytics {
  engagement: {
    totalInteractions: number;
    responseRate: number;
    avgResponseTime: number;
  };
  platforms: {
    twitter: { interactions: number; responsesSent: number };
    web: { conversations: number; messages: number };
    telegram: { conversations: number; messages: number };
  };
  timeline: Array<{
    date: string;
    interactions: number;
    responses: number;
  }>;
  topAccounts: Array<{
    username: string;
    interactions: number;
    category: string;
  }>;
  performance: {
    uptimePercentage: number;
    errorRate: number;
    avgApiLatency: number;
  };
}

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // For now, we'll generate mock analytics
      // In production, this would call an API endpoint
      const mockAnalytics: Analytics = {
        engagement: {
          totalInteractions: 342,
          responseRate: 87.5,
          avgResponseTime: 45
        },
        platforms: {
          twitter: { interactions: 234, responsesSent: 198 },
          web: { conversations: 76, messages: 423 },
          telegram: { conversations: 32, messages: 187 }
        },
        timeline: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          interactions: Math.floor(Math.random() * 50) + 20,
          responses: Math.floor(Math.random() * 40) + 15
        })),
        topAccounts: [
          { username: 'vitalik.eth', interactions: 45, category: 'crypto' },
          { username: 'naval', interactions: 38, category: 'philosophy' },
          { username: 'balajis', interactions: 32, category: 'tech' },
          { username: 'punk6529', interactions: 28, category: 'art' },
          { username: 'jessepollak', interactions: 24, category: 'crypto' }
        ],
        performance: {
          uptimePercentage: 99.8,
          errorRate: 0.3,
          avgApiLatency: 142
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="mr-2">📈</span>
          Analytics & Insights
        </h2>
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Interactions</span>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics.engagement.totalInteractions}</p>
          <p className="text-sm text-green-400 mt-2">↑ 12% from last period</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Response Rate</span>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics.engagement.responseRate}%</p>
          <p className="text-sm text-green-400 mt-2">↑ 5% from last period</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Avg Response Time</span>
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics.engagement.avgResponseTime}s</p>
          <p className="text-sm text-green-400 mt-2">↓ 8s from last period</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Platform Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500/10 border border-blue-700/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-white">🐦 Twitter</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Interactions</span>
                  <span className="text-white font-medium">{analytics.platforms.twitter.interactions}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Responses Sent</span>
                <span className="text-white font-medium">{analytics.platforms.twitter.responsesSent}</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-700/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-white">🌐 Web</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Conversations</span>
                  <span className="text-white font-medium">{analytics.platforms.web.conversations}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Messages</span>
                <span className="text-white font-medium">{analytics.platforms.web.messages}</span>
              </div>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-700/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-white">✈️ Telegram</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Conversations</span>
                  <span className="text-white font-medium">{analytics.platforms.telegram.conversations}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Messages</span>
                <span className="text-white font-medium">{analytics.platforms.telegram.messages}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Activity Timeline</h3>
        <div className="space-y-2">
          {analytics.timeline.map((day, idx) => (
            <div key={idx} className="flex items-center space-x-4">
              <span className="text-sm text-slate-400 w-24">{day.date}</span>
              <div className="flex-1 flex items-center space-x-2">
                <div className="flex-1 bg-slate-700 rounded-full h-6 flex overflow-hidden">
                  <div
                    className="bg-blue-500 flex items-center justify-end px-2"
                    style={{ width: `${(day.interactions / 50) * 100}%` }}
                  >
                    <span className="text-xs text-white">{day.interactions}</span>
                  </div>
                </div>
                <div className="flex-1 bg-slate-700 rounded-full h-6 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 flex items-center justify-end px-2"
                    style={{ width: `${(day.responses / 50) * 100}%` }}
                  >
                    <span className="text-xs text-white">{day.responses}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-6 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-slate-400">Interactions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span className="text-sm text-slate-400">Responses</span>
          </div>
        </div>
      </div>

      {/* Top Accounts */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Top Monitored Accounts</h3>
        <div className="space-y-3">
          {analytics.topAccounts.map((account, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-slate-600">#{idx + 1}</span>
                <div>
                  <p className="text-white font-medium">@{account.username}</p>
                  <p className="text-sm text-slate-400">{account.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{account.interactions}</p>
                <p className="text-xs text-slate-400">interactions</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h4 className="text-slate-400 text-sm mb-2">Uptime</h4>
          <p className="text-3xl font-bold text-green-400">{analytics.performance.uptimePercentage}%</p>
          <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${analytics.performance.uptimePercentage}%` }} />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h4 className="text-slate-400 text-sm mb-2">Error Rate</h4>
          <p className="text-3xl font-bold text-yellow-400">{analytics.performance.errorRate}%</p>
          <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${analytics.performance.errorRate}%` }} />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h4 className="text-slate-400 text-sm mb-2">Avg API Latency</h4>
          <p className="text-3xl font-bold text-blue-400">{analytics.performance.avgApiLatency}ms</p>
          <p className="text-sm text-slate-400 mt-2">Excellent performance</p>
        </div>
      </div>
    </div>
  );
}

