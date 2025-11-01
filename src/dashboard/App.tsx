import React, { useState, useEffect } from 'react';
import { ChromeStorageService } from '../lib/storage/chrome-storage';
import { db } from '../lib/storage/database';
import { TimeUtils } from '../lib/utils/helpers';
import { DailyStats, SiteLimit } from '../lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, Globe, TrendingUp, Download, Settings, Plus, Edit2, Trash2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function App() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [siteLimits, setSiteLimits] = useState<SiteLimit[]>([]);
  const [selectedDate] = useState(TimeUtils.getTodayString());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editingLimit, setEditingLimit] = useState<SiteLimit | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate, viewMode]);

  const loadData = async () => {
    try {
      const [limits] = await Promise.all([
        ChromeStorageService.getSiteLimits()
      ]);
      
      setSiteLimits(limits);
      await loadStats();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const dates = getDateRange();
    const statsData: DailyStats[] = [];

    for (const date of dates) {
      const stat = await ChromeStorageService.getDailyStats(date);
      if (stat) {
        statsData.push(stat);
      }
    }

    setStats(statsData);
  };

  const getDateRange = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    
    if (viewMode === 'day') {
      dates.push(selectedDate);
    } else if (viewMode === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
    } else if (viewMode === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const getChartData = () => {
    return stats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: Math.round(stat.totalTime / 60), // Convert to minutes
      visits: Object.values(stat.siteBreakdown).reduce((sum, site) => sum + site.visits, 0)
    }));
  };

  const getTopSites = () => {
    const siteAggregates: { [domain: string]: { time: number; visits: number; title: string } } = {};
    
    stats.forEach(stat => {
      Object.entries(stat.siteBreakdown).forEach(([domain, data]) => {
        if (!siteAggregates[domain]) {
          siteAggregates[domain] = { time: 0, visits: 0, title: data.title };
        }
        siteAggregates[domain].time += data.time;
        siteAggregates[domain].visits += data.visits;
      });
    });

    return Object.entries(siteAggregates)
      .map(([domain, data]) => ({ domain, ...data }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);
  };

  const getPieData = () => {
    const topSites = getTopSites().slice(0, 6);
    const totalTime = topSites.reduce((sum, site) => sum + site.time, 0);
    
    return topSites.map(site => ({
      name: site.domain,
      value: Math.round(site.time / 60), // Convert to minutes
      percentage: Math.round((site.time / totalTime) * 100)
    }));
  };

  const getTotalTime = () => {
    return stats.reduce((sum, stat) => sum + stat.totalTime, 0);
  };

  const exportData = async () => {
    try {
      const allLogs = await db.activityLogs.toArray();
      const csv = [
        ['Date', 'Domain', 'URL', 'Title', 'Duration (seconds)', 'Visits'],
        ...allLogs.map(log => [
          log.date,
          log.domain,
          log.url,
          log.title,
          log.duration.toString(),
          '1'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `web-activity-${TimeUtils.getTodayString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const saveLimit = async (limit: SiteLimit) => {
    try {
      if (editingLimit) {
        await ChromeStorageService.updateSiteLimit(editingLimit.id, limit);
      } else {
        await ChromeStorageService.addSiteLimit(limit);
      }
      await loadData();
      setShowLimitModal(false);
      setEditingLimit(null);
    } catch (error) {
      console.error('Error saving limit:', error);
    }
  };

  const deleteLimit = async (id: string) => {
    try {
      await ChromeStorageService.deleteSiteLimit(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting limit:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const chartData = getChartData();
  const topSites = getTopSites();
  const pieData = getPieData();
  const totalTime = getTotalTime();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Activity Dashboard
            </h1>
            
            <div className="flex items-center gap-4">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {TimeUtils.formatDuration(totalTime)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sites Visited</p>
                <p className="text-2xl font-bold text-gray-900">
                  {topSites.length}
                </p>
              </div>
              <Globe className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Limits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {siteLimits.filter(limit => limit.enabled).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Time Overview</h2>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value} min`, 'Time']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Distribution</h2>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} min`, 'Time']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Sites</h2>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topSites.map((site, index) => {
                const limit = siteLimits.find(limit => 
                  site.domain.includes(limit.pattern) || limit.pattern.includes(site.domain)
                );
                
                return (
                  <div key={site.domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                      <div>
                        <div className="font-medium text-gray-900">{site.domain}</div>
                        <div className="text-sm text-gray-500">
                          {TimeUtils.formatShortDuration(site.time)} • {site.visits} visits
                        </div>
                      </div>
                    </div>
                    {limit && (
                      <div className="text-sm text-gray-600">
                        Limit: {TimeUtils.formatShortDuration(limit.dailyLimit)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Site Limits</h2>
              <button
                onClick={() => setShowLimitModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Limit
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {siteLimits.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No limits set. Click "Add Limit" to get started.
                </div>
              ) : (
                siteLimits.map(limit => (
                  <div key={limit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {limit.pattern}
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          {limit.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Limit: {TimeUtils.formatShortDuration(limit.dailyLimit)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingLimit(limit);
                          setShowLimitModal(true);
                        }}
                        className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteLimit(limit.id)}
                        className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showLimitModal && (
        <LimitModal
          limit={editingLimit}
          onSave={saveLimit}
          onClose={() => {
            setShowLimitModal(false);
            setEditingLimit(null);
          }}
        />
      )}
    </div>
  );
}

interface LimitModalProps {
  limit: SiteLimit | null;
  onSave: (limit: SiteLimit) => void;
  onClose: () => void;
}

function LimitModal({ limit, onSave, onClose }: LimitModalProps) {
  const [formData, setFormData] = useState({
    pattern: limit?.pattern || '',
    type: limit?.type || 'domain' as 'domain' | 'regex',
    dailyLimit: limit?.dailyLimit || 3600,
    enabled: limit?.enabled ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLimit: SiteLimit = {
      id: limit?.id || crypto.randomUUID(),
      pattern: formData.pattern,
      type: formData.type,
      dailyLimit: formData.dailyLimit,
      enabled: formData.enabled,
      createdAt: limit?.createdAt || Date.now()
    };

    onSave(newLimit);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {limit ? 'Edit Limit' : 'Add New Limit'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pattern
            </label>
            <input
              type="text"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={formData.type === 'domain' ? 'example.com' : '.*\\.example\\.com.*'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'domain' | 'regex' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="domain">Domain</option>
              <option value="regex">Regex</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Limit (seconds)
            </label>
            <input
              type="number"
              value={formData.dailyLimit}
              onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="60"
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {TimeUtils.formatShortDuration(formData.dailyLimit)}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              Enabled
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}