# Web Activity Tracker Chrome Extension - Project Overview

## Project Purpose
A comprehensive Chrome extension for tracking web activity and setting time limits for websites. Recently extended to include YouTube Shorts blocking functionality.

## Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with web extension plugin
- **Styling**: Tailwind CSS
- **Storage**: Dexie.js (IndexedDB wrapper) + Chrome Storage API
- **Data Visualization**: Recharts
- **State Management**: Zustand
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Project Structure
```
src/
├── background.ts          # Service worker (background script)
├── content.ts             # Content script with YouTube Shorts blocker
├── popup/                 # Extension popup interface
├── dashboard/             # Statistics dashboard
├── options/               # Settings page
├── lib/
│   ├── storage/           # Data persistence (Chrome storage, IndexedDB)
│   ├── patterns/          # URL pattern matching
│   ├── utils/             # Helper functions
│   └── types.ts           # TypeScript interfaces
└── blocked/               # Blocked page display
```

## Key Features
- Real-time activity tracking with idle detection
- Customizable time limits for websites
- Detailed statistics with interactive charts
- Smart website blocking when limits reached
- YouTube Shorts blocking functionality
- Data export/import capabilities
- Privacy-focused (all data stored locally)

## Chrome Extension Architecture
- **Manifest V3** service worker pattern
- **Content scripts** for page interaction and Shorts blocking
- **Background script** for core tracking logic
- **Multiple UI contexts**: popup, dashboard, options page
- **Message passing** between components for real-time updates