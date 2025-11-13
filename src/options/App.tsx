import React, { useState, useEffect, useCallback } from 'react';
import { ChromeStorageService } from '../lib/storage/chrome-storage';
import { db } from '../lib/storage/database';
import { ExtensionSettings } from '../lib/types';
import { Settings, Download, Upload, Trash2, Save, RotateCcw, ArrowLeft } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    idleTimeout: 60,
    trackingExclusions: ['localhost', '127.0.0.1'],
    dataRetentionDays: 90,
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const currentSettings = await ChromeStorageService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await ChromeStorageService.saveSettings(settings);
      showMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const addExclusion = () => {
    setSettings({
      ...settings,
      trackingExclusions: [...settings.trackingExclusions, '']
    });
  };

  const updateExclusion = (index: number, value: string) => {
    const newExclusions = [...settings.trackingExclusions];
    newExclusions[index] = value;
    setSettings({ ...settings, trackingExclusions: newExclusions });
  };

  const removeExclusion = (index: number) => {
    const newExclusions = settings.trackingExclusions.filter((_, i) => i !== index);
    setSettings({ ...settings, trackingExclusions: newExclusions });
  };

  const exportData = async () => {
    try {
      const allLogs = await db.activityLogs.toArray();
      const siteLimits = await ChromeStorageService.getSiteLimits();
      const exportData = {
        activityLogs: allLogs,
        siteLimits,
        settings,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wakesmith-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showMessage('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      showMessage('Error exporting data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.activityLogs && Array.isArray(data.activityLogs)) {
        await db.activityLogs.clear();
        await db.activityLogs.bulkAdd(data.activityLogs);
      }

      if (data.siteLimits && Array.isArray(data.siteLimits)) {
        await ChromeStorageService.saveSiteLimits(data.siteLimits);
      }

      if (data.settings) {
        await ChromeStorageService.saveSettings(data.settings);
        setSettings(data.settings);
      }

      showMessage('Data imported successfully!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error importing data:', error);
      showMessage('Error importing data. Please check the file format.');
    }
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await db.activityLogs.clear();
        await ChromeStorageService.saveSiteLimits([]);
        showMessage('All data cleared successfully!');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Error clearing data:', error);
        showMessage('Error clearing data');
      }
    }
  };

  const resetSettings = async () => {
    if (confirm('Are you sure you want to reset settings to defaults?')) {
      const defaultSettings: ExtensionSettings = {
        idleTimeout: 60,
        trackingExclusions: ['localhost', '127.0.0.1'],
        dataRetentionDays: 90,
        theme: 'light'
      };
      
      try {
        await ChromeStorageService.saveSettings(defaultSettings);
        setSettings(defaultSettings);
        showMessage('Settings reset to defaults!');
      } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage('Error resetting settings');
      }
    }
  };

  const goToDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={goToDashboard}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" />
                WakeSmith Settings
              </h1>
            </div>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4`}>
          <div className={`p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-100 text-green-800 border border-green-200' : 
            'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idle Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.idleTimeout}
                  onChange={(e) => setSettings({ ...settings, idleTimeout: parseInt(e.target.value) || 60 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="300"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Time before the user is considered idle (10-300 seconds)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 90 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="7"
                  max="365"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How long to keep activity data (7-365 days)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tracking Exclusions</h2>
              <button
                onClick={addExclusion}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Add Exclusion
              </button>
            </div>
            
            <div className="space-y-2">
              {settings.trackingExclusions.map((exclusion, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={exclusion}
                    onChange={(e) => updateExclusion(index, e.target.value)}
                    placeholder="e.g., localhost or 192.168.1.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeExclusion(index)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Add domains or IP addresses that should not be tracked. Wildcards are supported.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Export Data</h3>
                <button
                  onClick={exportData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export All Data
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Download your activity data as JSON
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Import Data</h3>
                <label className="block">
                  <span className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Data
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Restore data from a backup file
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Clear All Data</h3>
                <button
                  onClick={clearAllData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Permanently delete all activity data
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Reset Settings</h3>
                <button
                  onClick={resetSettings}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Defaults
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Reset all settings to default values
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>WakeSmith</strong> v1.0.0</p>
              <p>Stop doomscrolling and wake up. Take control of your digital habits.</p>
              <div className="pt-2">
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Real-time activity tracking</li>
                  <li>Customizable time limits</li>
                  <li>Detailed statistics and charts</li>
                  <li>Data export/import functionality</li>
                  <li>Privacy-focused (all data stored locally)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}