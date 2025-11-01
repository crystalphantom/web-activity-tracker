import { useState, useEffect } from 'react';
import { ChromeStorageService } from '../lib/storage/chrome-storage';
import { TimeUtils } from '../lib/utils/helpers';
import { DailyStats, SiteLimit } from '../lib/types';
import { Clock, Globe, Settings, BarChart3, AlertCircle } from 'lucide-react';

interface SiteTimeData {
  domain: string;
  time: number;
  visits: number;
  title: string;
}

export default function App() {
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [siteLimits, setSiteLimits] = useState<SiteLimit[]>([]);
  const [topSites, setTopSites] = useState<SiteTimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = TimeUtils.getTodayString();
      const [stats, limits] = await Promise.all([
        ChromeStorageService.getDailyStats(today),
        ChromeStorageService.getSiteLimits()
      ]);

      setTodayStats(stats);
      setSiteLimits(limits.filter(limit => limit.enabled));

      if (stats) {
        const sites = Object.entries(stats.siteBreakdown)
          .map(([domain, data]) => ({
            domain,
            time: data.time,
            visits: data.visits,
            title: data.title
          }))
          .sort((a, b) => b.time - a.time)
          .slice(0, 5);
        
        setTopSites(sites);
      }
    } catch (error) {
      console.error('Error loading popup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLimitStatus = (domain: string) => {
    const limit = siteLimits.find(limit => {
      return domain.includes(limit.pattern) || limit.pattern.includes(domain);
    });

    if (!limit) return null;

    const timeSpent = todayStats?.siteBreakdown[domain]?.time || 0;
    const percentage = (timeSpent / limit.dailyLimit) * 100;

    if (percentage >= 100) return { status: 'blocked', color: 'text-red-600', limit };
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600', limit };
    if (percentage >= 50) return { status: 'caution', color: 'text-orange-600', limit };
    return { status: 'safe', color: 'text-green-600', limit };
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="w-80 h-96 flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white">
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Tracker
          </h1>
          <button
            onClick={openOptions}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold">
            {TimeUtils.formatShortDuration(todayStats?.totalTime || 0)}
          </div>
          <div className="text-sm opacity-90">Today's active time</div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Top Sites Today
          </h2>
          
          {topSites.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              No activity tracked yet today
            </div>
          ) : (
            <div className="space-y-2">
              {topSites.map((site, index) => {
                const limitStatus = getLimitStatus(site.domain);
                return (
                  <div key={site.domain} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                        <div className="font-medium text-sm truncate">
                          {site.domain}
                        </div>
                        {limitStatus && (
                          <div className={`flex items-center gap-1 ${limitStatus.color}`}>
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs">
                              {Math.round((site.time / limitStatus.limit.dailyLimit) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 ml-6">
                        {TimeUtils.formatShortDuration(site.time)} • {site.visits} visits
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={openDashboard}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={openOptions}
            className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}