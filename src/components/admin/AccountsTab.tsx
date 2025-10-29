'use client';

import { useState, useEffect } from 'react';

interface Account {
  id: string;
  username: string;
  priority: string;
  category: string;
  is_active: boolean;
  interactions: number;
  created_at?: string;
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    priority: 'medium',
    category: 'general'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({ username: '', priority: 'medium', category: 'general' });
        fetchAccounts();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add account');
      }
    } catch (error) {
      console.error('Failed to add account:', error);
      alert('Failed to add account');
    }
  };

  const handleUpdateAccount = async (account: Account, updates: Partial<Account>) => {
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id, ...updates })
      });

      if (response.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to stop monitoring this account?')) return;

    try {
      const response = await fetch(`/api/admin/accounts?id=${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-700';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-700';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-700';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-700';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-700';
    }
  };

  const accountsByPriority = accounts.reduce((acc, account) => {
    const priority = account.priority || 'medium';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-2">🎯</span>
            Target Account Management
          </h2>
          <p className="text-slate-400 mt-1">Monitor {accounts.length} accounts across all tiers</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchAccounts}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            ➕ Add Account
          </button>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Add New Account</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Twitter Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="@username or username"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Priority Tier
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="critical">Critical - Instant response</option>
                  <option value="high">High - Priority monitoring</option>
                  <option value="medium">Medium - Regular monitoring</option>
                  <option value="low">Low - Occasional check</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., crypto, philosophy, art"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading accounts...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {['critical', 'high', 'medium', 'low'].map(priority => {
            const priorityAccounts = accountsByPriority[priority] || [];
            if (priorityAccounts.length === 0) return null;

            return (
              <div key={priority} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className={`px-3 py-1 rounded text-sm ${getPriorityColor(priority)} border mr-3`}>
                    {priority.toUpperCase()}
                  </span>
                  {priorityAccounts.length} account{priorityAccounts.length !== 1 ? 's' : ''}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {priorityAccounts.map(account => (
                    <div
                      key={account.id}
                      className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">@{account.username}</p>
                          <p className="text-xs text-slate-400 mt-1">{account.category}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateAccount(account, { is_active: !account.is_active })}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              account.is_active
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-slate-600 text-slate-400'
                            }`}
                            title={account.is_active ? 'Active' : 'Inactive'}
                          >
                            {account.is_active ? '✓' : '○'}
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center"
                            title="Remove"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{account.interactions} interactions</span>
                        <button
                          onClick={() => window.open(`https://twitter.com/${account.username}`, '_blank')}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

