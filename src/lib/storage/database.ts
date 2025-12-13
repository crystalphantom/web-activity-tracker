import Dexie, { Table } from 'dexie';
import { ActivityLog, LimitedAccessSession } from '../types';

export class ActivityDatabase extends Dexie {
  activityLogs!: Table<ActivityLog>;
  limitedAccessSessions!: Table<LimitedAccessSession>;

  constructor() {
    super('WebActivityTracker');
    this.version(2).stores({
      activityLogs: '++id, url, domain, title, timestamp, duration, date, [date+domain]',
      limitedAccessSessions: '++id, domain, reasonId, category, startTime, endTime, date, [date+domain]'
    });
  }
}

export const db = new ActivityDatabase();