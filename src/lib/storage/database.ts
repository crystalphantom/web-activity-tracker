import Dexie, { Table } from 'dexie';
import { ActivityLog } from '../types';

export class ActivityDatabase extends Dexie {
  activityLogs!: Table<ActivityLog>;

  constructor() {
    super('WebActivityTracker');
    this.version(1).stores({
      activityLogs: '++id, url, domain, title, timestamp, duration, date, [date+domain]'
    });
  }
}

export const db = new ActivityDatabase();