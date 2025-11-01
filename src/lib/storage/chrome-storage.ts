import { SiteLimit, DailyStats, ExtensionSettings } from '../types';

const STORAGE_KEYS = {
  SITE_LIMITS: 'siteLimits',
  DAILY_STATS: 'dailyStats',
  SETTINGS: 'settings'
} as const;

export class ChromeStorageService {
  static async getSiteLimits(): Promise<SiteLimit[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SITE_LIMITS);
    return result[STORAGE_KEYS.SITE_LIMITS] || [];
  }

  static async saveSiteLimits(limits: SiteLimit[]): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SITE_LIMITS]: limits });
  }

  static async addSiteLimit(limit: SiteLimit): Promise<void> {
    const limits = await this.getSiteLimits();
    limits.push(limit);
    await this.saveSiteLimits(limits);
  }

  static async updateSiteLimit(id: string, updates: Partial<SiteLimit>): Promise<void> {
    const limits = await this.getSiteLimits();
    const index = limits.findIndex(limit => limit.id === id);
    if (index !== -1) {
      limits[index] = { ...limits[index], ...updates };
      await this.saveSiteLimits(limits);
    }
  }

  static async deleteSiteLimit(id: string): Promise<void> {
    const limits = await this.getSiteLimits();
    const filtered = limits.filter(limit => limit.id !== id);
    await this.saveSiteLimits(filtered);
  }

  static async getDailyStats(date: string): Promise<DailyStats | null> {
    const result = await chrome.storage.local.get(`${STORAGE_KEYS.DAILY_STATS}_${date}`);
    return result[`${STORAGE_KEYS.DAILY_STATS}_${date}`] || null;
  }

  static async saveDailyStats(stats: DailyStats): Promise<void> {
    await chrome.storage.local.set({ 
      [`${STORAGE_KEYS.DAILY_STATS}_${stats.date}`]: stats 
    });
  }

  static async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || {
      idleTimeout: 60,
      trackingExclusions: ['localhost', '127.0.0.1'],
      dataRetentionDays: 90,
      theme: 'light'
    };
  }

  static async saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  }

  static async clearOldData(): Promise<void> {
    const settings = await this.getSettings();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetentionDays);
    
    const allKeys = await chrome.storage.local.get(null);
    const keysToDelete = Object.keys(allKeys).filter(key => {
      if (key.startsWith(STORAGE_KEYS.DAILY_STATS)) {
        const dateStr = key.split('_').pop();
        if (dateStr) {
          const date = new Date(dateStr);
          return date < cutoffDate;
        }
      }
      return false;
    });

    if (keysToDelete.length > 0) {
      await chrome.storage.local.remove(keysToDelete);
    }
  }
}