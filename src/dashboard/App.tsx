import React, { useState, useEffect } from 'react';
import { ChromeStorageService } from '../lib/storage/chrome-storage';
import { db } from '../lib/storage/database';
import { TimeUtils } from '../lib/utils/helpers';
import { DailyStats, SiteLimit } from '../lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, Clock, Globe, TrendingUp, Download, Settings, Plus, RefreshCw ,  Edit2, Trash2 } from 'lucide-react';

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

  const toggleLimit = async (limit: SiteLimit) => {
    try {
      const updatedLimit = { ...limit, enabled: !limit.enabled };
      await ChromeStorageService.updateSiteLimit(limit.id, updatedLimit);
      await loadData();
    } catch (error) {
      console.error('Error toggling limit:', error);
    }
  };

  const addDefaultPresets = async () => {
    try {
      const existingLimits = await ChromeStorageService.getSiteLimits();
      const hasDefaultPresets = existingLimits.some(limit => 
        limit.pattern.includes('youtube.com/shorts') || 
        limit.pattern.includes('instagram.com') ||
        limit.pattern.includes('facebook.com')
      );
      
      if (hasDefaultPresets) {
        alert('Default presets are already added!');
        return;
      }

      const defaultLimits = [
        {
          id: crypto.randomUUID(),
          pattern: '.*youtube\\.com/shorts.*',
          type: 'regex' as const,
          dailyLimit: 0,
          enabled: true,
          createdAt: Date.now()
        },
        {
          id: crypto.randomUUID(),
          pattern: '.*drama.*',
          type: 'regex' as const,
          dailyLimit: 0,
          enabled: true,
          createdAt: Date.now()
        },
        {
          id: crypto.randomUUID(),
          pattern: '.*anime.*',
          type: 'regex' as const,
          dailyLimit: 0,
          enabled: true,
          createdAt: Date.now()
        },
        {
          id: crypto.randomUUID(),
          pattern: 'instagram.com',
          type: 'domain' as const,
          dailyLimit: 0,
          enabled: true,
          createdAt: Date.now()
        },
        {
          id: crypto.randomUUID(),
          pattern: 'facebook.com',
          type: 'domain' as const,
          dailyLimit: 0,
          enabled: true,
          createdAt: Date.now()
        }
      ];

      for (const limit of defaultLimits) {
        await ChromeStorageService.addSiteLimit(limit);
      }
      
      await loadData();
      alert('Default presets added successfully!');
    } catch (error) {
      console.error('Error adding default presets:', error);
      alert('Error adding default presets');
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
                   innerRadius={60}
                   outerRadius={100}
                   fill="#8884d8"
                   dataKey="value"
                   label={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} min`, 'Time']} />
                 <Legend layout="vertical" align="right" verticalAlign="middle" />
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
              <div className="flex gap-2">
                <button
                  onClick={addDefaultPresets}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  < RefreshCw className="w-4 h-4" />
                  Reload Presets
                </button>
                <button
                  onClick={() => setShowLimitModal(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Limit
                </button>
              </div>
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
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-gray-900">
                          {limit.pattern}
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          {limit.type}
                        </span>
                        {!limit.enabled && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Limit: {TimeUtils.formatShortDuration(limit.dailyLimit)}
                        {limit.dailyLimit === 0 && (
                          <span className="text-red-600 ml-2">(Blocked)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleLimit(limit)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          limit.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            limit.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
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
    enabled: limit?.enabled ?? true,
    hours: Math.floor((limit?.dailyLimit || 3600) / 3600),
    minutes: Math.floor(((limit?.dailyLimit || 3600) % 3600) / 60)
  });
  const [timeInputMode, setTimeInputMode] = useState<'hours' | 'minutes'>('hours');

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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Daily Limit
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimeInputMode('hours')}
                  className={`px-3 py-1 text-xs rounded ${
                    timeInputMode === 'hours'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Hours
                </button>
                <button
                  type="button"
                  onClick={() => setTimeInputMode('minutes')}
                  className={`px-3 py-1 text-xs rounded ${
                    timeInputMode === 'minutes'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Minutes
                </button>
              </div>
            </div>
            
            {timeInputMode === 'hours' ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Hours</label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => {
                      const hours = parseInt(e.target.value) || 0;
                      const newLimit = hours * 3600 + formData.minutes * 60;
                      setFormData({ ...formData, hours, dailyLimit: newLimit });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="23"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                  <input
                    type="number"
                    value={formData.minutes}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value) || 0;
                      const newLimit = formData.hours * 3600 + minutes * 60;
                      setFormData({ ...formData, minutes, dailyLimit: newLimit });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  value={Math.floor(formData.dailyLimit / 60)}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, dailyLimit: minutes * 60 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <div className="text-xs text-gray-500 mt-1">Total minutes</div>
              </div>
            )}
            
            <div className="text-sm text-gray-500 mt-2">
              {TimeUtils.formatShortDuration(formData.dailyLimit)}
              {formData.dailyLimit === 0 && (
                <span className="text-red-600 ml-2">(Completely blocked)</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                Enable Limit
              </label>
              <div className="text-xs text-gray-500">
                {formData.enabled ? 'Limit is active' : 'Limit is disabled'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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