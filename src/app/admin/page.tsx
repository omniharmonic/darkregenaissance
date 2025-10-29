'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConversationsTab from '@/components/admin/ConversationsTab';
import AccountsTab from '@/components/admin/AccountsTab';
import MonitoringTab from '@/components/admin/MonitoringTab';
import ActionsTab from '@/components/admin/ActionsTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';

interface DashboardStats {
  twitter: {
    mentions: number;
    responses: number;
    targetAccounts: number;
    apiCalls: number;
  };
  web: {
    conversations: number;
    messages: number;
  };
  telegram: {
    conversations: number;
    messages: number;
  };
  system: {
    uptime: string;
    lastCheck: string;
    health: 'healthy' | 'warning' | 'error';
  };
}

interface Activity {
  id: string;
  type: 'twitter' | 'web' | 'telegram';
  action: string;
  timestamp: string;
  details: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch {
        router.push('/admin/login');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: string;
    color: string;
  }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`text-2xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-xl">🍄</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dark Renaissance</h1>
                <p className="text-xs text-slate-400">Bot Control Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${stats?.system.health === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                <span className="text-sm text-slate-400">System {stats?.system.health || 'Unknown'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/30 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'conversations', label: 'Conversations', icon: '💬' },
              { id: 'accounts', label: 'Target Accounts', icon: '🎯' },
              { id: 'monitoring', label: 'System', icon: '🔧' },
              { id: 'actions', label: 'Actions', icon: '⚡' },
              { id: 'analytics', label: 'Analytics', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Twitter Mentions"
                value={stats?.twitter.mentions || 0}
                subtitle={`${stats?.twitter.responses || 0} responses sent`}
                icon="🐦"
                color="text-blue-400"
              />
              <StatCard
                title="Web Conversations"
                value={stats?.web.conversations || 0}
                subtitle={`${stats?.web.messages || 0} total messages`}
                icon="🌐"
                color="text-purple-400"
              />
              <StatCard
                title="Telegram Chats"
                value={stats?.telegram.conversations || 0}
                subtitle={`${stats?.telegram.messages || 0} messages`}
                icon="✈️"
                color="text-cyan-400"
              />
              <StatCard
                title="Target Accounts"
                value={stats?.twitter.targetAccounts || 0}
                subtitle="Actively monitored"
                icon="🎯"
                color="text-emerald-400"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Recent Activity
              </h2>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No recent activity</p>
                ) : (
                  activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-xl">
                        {activity.type === 'twitter' ? '🐦' : activity.type === 'web' ? '🌐' : '✈️'}
                      </span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{activity.action}</p>
                        <p className="text-slate-400 text-xs mt-1">{activity.details}</p>
                        <p className="text-slate-500 text-xs mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🚀</span>
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Check Mentions', action: 'check-mentions', icon: '🔍' },
                  { label: 'Post Tweet', action: 'post-tweet', icon: '📝' },
                  { label: 'System Health', action: 'health-check', icon: '💚' },
                  { label: 'Clear Cache', action: 'clear-cache', icon: '🗑️' }
                ].map(btn => (
                  <button
                    key={btn.action}
                    onClick={() => router.push(`/admin?tab=actions&action=${btn.action}`)}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-white transition-colors"
                  >
                    <span className="text-2xl block mb-2">{btn.icon}</span>
                    <span className="text-sm">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conversations' && <ConversationsTab />}
        {activeTab === 'accounts' && <AccountsTab />}
        {activeTab === 'monitoring' && <MonitoringTab />}
        {activeTab === 'actions' && <ActionsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>
    </div>
  );
}

