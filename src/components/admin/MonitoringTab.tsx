'use client';

import { useState, useEffect } from 'react';

interface SystemInfo {
  database: {
    status: string;
    latency: number;
    error?: string;
  };
  api: {
    twitter: {
      todayRequests: number;
      lastHourRequests: number;
      dailyLimit: number;
      hourlyLimit: number;
    };
    openai: {
      todayRequests: number;
      monthlyLimit: number;
    };
  };
  errors: Array<{ message?: string; created_at: string }>;
  uptime: {
    seconds: number;
    started: string;
  };
  memory: {
    used: number;
    total: number;
  };
  environment: {
    nodeVersion: string;
    platform: string;
  };
}

export default function MonitoringTab() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/admin/system');
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-700';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-700';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-700';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading system information...</p>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load system information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="mr-2">🔧</span>
          System Monitoring
        </h2>
        <button
          onClick={fetchSystemInfo}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Database</h3>
            <span className={`px-3 py-1 rounded text-sm border ${getStatusColor(systemInfo.database.status)}`}>
              {systemInfo.database.status}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Latency</span>
              <span className="text-white font-medium">{systemInfo.database.latency}ms</span>
            </div>
            {systemInfo.database.error && (
              <p className="text-red-400 text-xs mt-2">{systemInfo.database.error}</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">System</h3>
            <span className="px-3 py-1 rounded text-sm bg-green-500/20 text-green-400 border border-green-700">
              online
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Uptime</span>
              <span className="text-white font-medium">{formatUptime(systemInfo.uptime.seconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memory</span>
              <span className="text-white font-medium">
                {systemInfo.memory.used.toFixed(1)} / {systemInfo.memory.total.toFixed(1)} MB
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Environment</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Node.js</span>
              <span className="text-white font-medium">{systemInfo.environment.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Platform</span>
              <span className="text-white font-medium">{systemInfo.environment.platform}</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Usage */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">API Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Twitter API */}
          <div>
            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
              <span className="mr-2">🐦</span>
              Twitter API
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Hourly Usage</span>
                  <span className="text-white">
                    {systemInfo.api.twitter.lastHourRequests} / {systemInfo.api.twitter.hourlyLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(systemInfo.api.twitter.lastHourRequests / systemInfo.api.twitter.hourlyLimit) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Daily Usage</span>
                  <span className="text-white">
                    {systemInfo.api.twitter.todayRequests} / {systemInfo.api.twitter.dailyLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(systemInfo.api.twitter.todayRequests / systemInfo.api.twitter.dailyLimit) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* OpenAI API */}
          <div>
            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              OpenAI API
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Monthly Usage</span>
                  <span className="text-white">
                    {systemInfo.api.openai.todayRequests} / {systemInfo.api.openai.monthlyLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(systemInfo.api.openai.todayRequests / systemInfo.api.openai.monthlyLimit) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {systemInfo.errors.length > 0 && (
        <div className="bg-slate-800/50 border border-red-700/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            Recent Errors
          </h3>
          <div className="space-y-3">
            {systemInfo.errors.slice(0, 5).map((error, idx) => (
              <div key={idx} className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error.message || 'Unknown error'}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {new Date(error.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Started Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400 mb-1">Started At</p>
            <p className="text-white">{new Date(systemInfo.uptime.started).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Uptime</p>
            <p className="text-white">{formatUptime(systemInfo.uptime.seconds)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

