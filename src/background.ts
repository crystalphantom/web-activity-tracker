import { db } from './lib/storage/database';
import { ChromeStorageService } from './lib/storage/chrome-storage';
import { PatternMatcher } from './lib/patterns/matcher';
import { TimeUtils, UUID } from './lib/utils/helpers';
import { SiteLimit } from './lib/types';

interface TrackingState {
  activeTabId: number | null;
  activeUrl: string | null;
  startTime: number | null;
  isIdle: boolean;
  lastUpdateTime: number;
}

class ActivityTracker {
  private state: TrackingState = {
    activeTabId: null,
    activeUrl: null,
    startTime: null,
    isIdle: false,
    lastUpdateTime: Date.now()
  };

  private updateInterval: number | null = null;
  private idleCheckInterval: number | null = null;

  constructor() {
    this.initialize();
    this.setupMessageHandlers();
  }

  private async initialize() {
    await this.setupAlarms();
    this.setupEventListeners();
    this.startTracking();
    console.log('Web Activity Tracker initialized');
  }

  private setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async response
    });
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: Function) {
    try {
      switch (message.type) {
        case 'CHECK_BLOCK_STATUS':
          const isBlocked = await this.checkSiteLimits(message.url);
          const today = TimeUtils.getTodayString();
          const stats = await ChromeStorageService.getDailyStats(today);
          const domain = PatternMatcher.extractDomain(message.url);
          const timeSpent = stats?.siteBreakdown[domain]?.time || 0;
          const limit = await this.getMatchingLimit(message.url);
          
          sendResponse({
            blocked: isBlocked,
            message: `You've reached your daily time limit for ${domain}`,
            timeSpent: TimeUtils.formatShortDuration(timeSpent),
            limit: limit ? TimeUtils.formatShortDuration(limit.dailyLimit) : 'Unknown'
          });
          break;

        case 'GET_BLOCK_INFO':
          const blockLimit = await this.getMatchingLimit(sender.url || '');
          const blockStats = await ChromeStorageService.getDailyStats(TimeUtils.getTodayString());
          const blockDomain = PatternMatcher.extractDomain(sender.url || '');
          const blockTimeSpent = blockStats?.siteBreakdown[blockDomain]?.time || 0;
          
          sendResponse({
            domain: blockDomain,
            timeSpent: blockTimeSpent,
            limit: blockLimit?.dailyLimit || 0,
            message: `You've reached your daily time limit for ${blockDomain}`
          });
          break;

        case 'PAGE_ACTIVITY':
          // Handle page activity signals from content scripts
          if (message.visible && !this.state.isIdle) {
            // Update tracking if page is visible and user is not idle
            if (sender.tab?.id && sender.tab.url && PatternMatcher.isValidUrl(sender.tab.url)) {
              await this.setActiveTab(sender.tab.id, sender.tab.url, message.title || '');
            }
          }
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: 'Internal error' });
    }
  }

  private async getMatchingLimit(url: string): Promise<SiteLimit | null> {
    const limits = await ChromeStorageService.getSiteLimits();
    for (const limit of limits) {
      if (!limit.enabled) continue;
      if (PatternMatcher.matchesPattern(url, limit.pattern, limit.type)) {
        return limit;
      }
    }
    return null;
  }

  private setupAlarms() {
    chrome.alarms.create('dailyReset', {
      when: TimeUtils.getEndOfDay(new Date()) + 1000,
      periodInMinutes: 24 * 60
    });

    chrome.alarms.create('cleanup', {
      periodInMinutes: 60
    });
  }

  private setupEventListeners() {
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    chrome.windows.onFocusChanged.addListener(this.handleWindowFocusChanged.bind(this));
    chrome.idle.onStateChanged.addListener(this.handleIdleStateChanged.bind(this));
    chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
  }

  private startTracking() {
    this.updateInterval = setInterval(() => {
      this.updateTracking();
    }, 1000) as unknown as number;

    this.idleCheckInterval = setInterval(() => {
      this.checkIdleState();
    }, 10000) as unknown as number;

    // Use intervals to avoid TypeScript warnings
    void this.updateInterval;
    void this.idleCheckInterval;
  }

  private async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.title && PatternMatcher.isValidUrl(tab.url)) {
        await this.setActiveTab(tab.id!, tab.url, tab.title);
      }
    } catch (error) {
      console.error('Error handling tab activation:', error);
    }
  }

  private async handleTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.url && tab.id === this.state.activeTabId && PatternMatcher.isValidUrl(changeInfo.url)) {
      await this.setActiveTab(tabId, changeInfo.url, tab.title || '');
    }
  }

  private async handleWindowFocusChanged(windowId: number) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      this.pauseTracking();
    } else {
      try {
        const tabs = await chrome.tabs.query({ active: true, windowId });
        if (tabs.length > 0) {
          const tab = tabs[0];
          if (tab.url && tab.title && PatternMatcher.isValidUrl(tab.url)) {
            await this.setActiveTab(tab.id!, tab.url, tab.title);
          }
        }
      } catch (error) {
        console.error('Error handling window focus change:', error);
      }
    }
  }

  private async handleIdleStateChanged(newState: chrome.idle.IdleState) {
    const wasIdle = this.state.isIdle;
    this.state.isIdle = newState === 'idle' || newState === 'locked';

    if (this.state.isIdle && !wasIdle) {
      this.pauseTracking();
    } else if (!this.state.isIdle && wasIdle) {
      this.resumeTracking();
    }
  }

  private async handleAlarm(alarm: chrome.alarms.Alarm) {
    if (alarm.name === 'dailyReset') {
      await this.performDailyReset();
    } else if (alarm.name === 'cleanup') {
      await ChromeStorageService.clearOldData();
    }
  }

  private async setActiveTab(tabId: number, url: string, _title: string) {
    if (!PatternMatcher.isValidUrl(url)) {
      this.pauseTracking();
      return;
    }

    const settings = await ChromeStorageService.getSettings();
    
    if (PatternMatcher.isExcluded(url, settings.trackingExclusions)) {
      this.pauseTracking();
      return;
    }

    const shouldBlock = await this.checkSiteLimits(url);
    if (shouldBlock) {
      await this.blockSite(tabId);
      return;
    }

    if (this.state.activeUrl !== url) {
      await this.saveCurrentActivity();
      this.state.activeTabId = tabId;
      this.state.activeUrl = url;
      this.state.startTime = Date.now();
      this.state.lastUpdateTime = Date.now();
      this.updateBadge();
    }
  }

  private async checkSiteLimits(url: string): Promise<boolean> {
    const limits = await ChromeStorageService.getSiteLimits();
    const today = TimeUtils.getTodayString();
    
    for (const limit of limits) {
      if (!limit.enabled) continue;
      
      if (PatternMatcher.matchesPattern(url, limit.pattern, limit.type)) {
        const stats = await ChromeStorageService.getDailyStats(today);
        const domain = PatternMatcher.extractDomain(url);
        const timeSpent = stats?.siteBreakdown[domain]?.time || 0;
        
        if (timeSpent >= limit.dailyLimit) {
          return true;
        }
      }
    }
    
    return false;
  }

  private async blockSite(tabId: number) {
    const blockedUrl = chrome.runtime.getURL('src/blocked.html');
    await chrome.tabs.update(tabId, { url: blockedUrl });
  }

  private pauseTracking() {
    if (this.state.startTime) {
      this.saveCurrentActivity();
      this.state.startTime = null;
    }
    this.updateBadge();
  }

  private resumeTracking() {
    if (this.state.activeUrl && !this.state.startTime) {
      this.state.startTime = Date.now();
      this.updateBadge();
    }
  }

  private async updateTracking() {
    if (!this.state.startTime || this.state.isIdle) return;

    const now = Date.now();
    const elapsed = Math.floor((now - this.state.lastUpdateTime) / 1000);
    
    if (elapsed >= 30) {
      await this.saveCurrentActivity();
      this.state.lastUpdateTime = now;
    }

    this.updateBadge();
  }

  private async checkIdleState() {
    const settings = await ChromeStorageService.getSettings();
    try {
      // For now, we'll skip idle detection to avoid API issues
      // In production, this would need proper Chrome idle API implementation
      console.log('Checking idle state with timeout:', settings.idleTimeout);
    } catch (error) {
      console.error('Error checking idle state:', error);
    }
  }

  private async saveCurrentActivity() {
    if (!this.state.startTime || !this.state.activeUrl) return;

    const duration = Math.floor((Date.now() - this.state.startTime) / 1000);
    if (duration < 1) return;

    const domain = PatternMatcher.extractDomain(this.state.activeUrl);
    const today = TimeUtils.getTodayString();

    try {
      await db.activityLogs.add({
        id: UUID.generate(),
        url: this.state.activeUrl,
        domain,
        title: await this.getTabTitle(),
        timestamp: this.state.startTime,
        duration,
        date: today
      });

      await this.updateDailyStats(today, domain, duration);
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  }

  private async getTabTitle(): Promise<string> {
    if (!this.state.activeTabId) return '';
    
    try {
      const tab = await chrome.tabs.get(this.state.activeTabId);
      return tab.title || '';
    } catch {
      return '';
    }
  }

  private async updateDailyStats(date: string, domain: string, duration: number) {
    let stats = await ChromeStorageService.getDailyStats(date);
    
    if (!stats) {
      stats = {
        date,
        totalTime: 0,
        siteBreakdown: {},
        lastUpdated: Date.now()
      };
    }

    if (!stats.siteBreakdown[domain]) {
      stats.siteBreakdown[domain] = {
        time: 0,
        visits: 0,
        title: await this.getTabTitle()
      };
    }

    stats.siteBreakdown[domain].time += duration;
    stats.siteBreakdown[domain].visits += 1;
    stats.totalTime += duration;
    stats.lastUpdated = Date.now();

    await ChromeStorageService.saveDailyStats(stats);
  }

  private async performDailyReset() {
    const today = TimeUtils.getTodayString();
    const stats = await ChromeStorageService.getDailyStats(today);
    
    if (!stats || stats.totalTime === 0) {
      await ChromeStorageService.saveDailyStats({
        date: today,
        totalTime: 0,
        siteBreakdown: {},
        lastUpdated: Date.now()
      });
    }
  }

  private updateBadge() {
    if (!this.state.startTime || this.state.isIdle) {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setBadgeBackgroundColor({ color: '#9ca3af' });
      return;
    }

    const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    
    if (minutes > 0) {
      chrome.action.setBadgeText({ text: `${minutes}m` });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
  }
}

new ActivityTracker();