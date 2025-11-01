export interface ActivityLog {
  id: string;
  url: string;
  domain: string;
  title: string;
  timestamp: number;
  duration: number;
  date: string;
}

export interface SiteLimit {
  id: string;
  pattern: string;
  type: 'domain' | 'regex';
  compiledRegex?: string;
  dailyLimit: number;
  enabled: boolean;
  createdAt: number;
}

export interface DailyStats {
  date: string;
  totalTime: number;
  siteBreakdown: {
    [domain: string]: {
      time: number;
      visits: number;
      title: string;
    };
  };
  lastUpdated: number;
}

export interface ExtensionSettings {
  idleTimeout: number;
  trackingExclusions: string[];
  dataRetentionDays: number;
  theme: 'light' | 'dark';
}