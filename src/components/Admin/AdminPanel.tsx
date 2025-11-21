import React, { useEffect, useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Server,
  Key,
  BarChart3,
  Shield,
  Search,
} from 'lucide-react';
import { toolAPI } from '../../services/api';
import type { Tool } from '../../types';

interface AdminStats {
  activePlans: number;
  completedPlans: number;
  failedPlans: number;
  totalTokensUsed: number;
  monthlySpend: number;
}

export const AdminPanel: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<AdminStats>({
    activePlans: 0,
    completedPlans: 0,
    failedPlans: 0,
    totalTokensUsed: 0,
    monthlySpend: 0,
  });
  const [showNewToolForm, setShowNewToolForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tools' | 'credentials' | 'policies'>('overview');

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setIsLoading(true);
      const loadedTools = await toolAPI.getTools();
      setTools(loadedTools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskLevelColor = (level: Tool['risk_level']) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Admin Panel</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {(['overview', 'tools', 'credentials', 'policies'] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                selectedTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Active Plans</h3>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.activePlans}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">
                  Completed
                </h3>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.completedPlans}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Failed</h3>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.failedPlans}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Tokens</h3>
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {(stats.totalTokensUsed / 1000).toFixed(1)}k
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">
                  Spend
                </h3>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                ${stats.monthlySpend.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              System Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600">API Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Healthy
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600">Orchestrator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Healthy
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600">
                    Memory Layer
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'tools' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowNewToolForm(!showNewToolForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Tool
            </button>
          </div>

          {showNewToolForm && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Register New Tool
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tool Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., google_drive_read"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Risk Level
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>low</option>
                      <option>medium</option>
                      <option>high</option>
                      <option>critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Auth Type
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>none</option>
                      <option>api_key</option>
                      <option>oauth</option>
                      <option>service_account</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Tool description..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowNewToolForm(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Register Tool
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-slate-600">
                Loading tools...
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                No tools found
              </div>
            ) : (
              filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {tool.name}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {tool.description}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${getRiskLevelColor(tool.risk_level)}`}
                      >
                        {tool.risk_level}
                      </span>
                      {tool.is_active ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {tool.usage_count}
                      </div>
                      <div className="text-xs text-slate-600">Uses</div>
                    </div>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedTab === 'credentials' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-6 h-6 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              API Credentials
            </h3>
          </div>
          <p className="text-slate-600 mb-4">
            Manage OAuth tokens and API keys for connectors
          </p>
          <div className="text-center py-12 text-slate-600">
            Credentials are securely stored in Vault and never logged
          </div>
        </div>
      )}

      {selectedTab === 'policies' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Access Policies
            </h3>
          </div>
          <p className="text-slate-600 mb-4">
            Define authorization rules and data access policies
          </p>
          <div className="space-y-3">
            <div className="border border-slate-200 rounded p-4">
              <div className="font-medium text-slate-900 mb-1">
                Default Policy
              </div>
              <div className="text-sm text-slate-600">
                Users can only access their own conversations and plans
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
