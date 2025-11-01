# Web Activity Tracker Chrome Extension

A comprehensive Chrome extension for tracking web activity and setting time limits for websites. Built with React, TypeScript, and modern web technologies.

## Features

- **Real-time Activity Tracking**: Automatically tracks time spent on websites
- **Customizable Time Limits**: Set daily time limits for specific websites or domains
- **Detailed Statistics**: View daily, weekly, and monthly activity data with interactive charts
- **Smart Blocking**: Blocks access to websites when time limits are reached
- **Data Export/Import**: Backup and restore your activity data
- **Privacy-Focused**: All data stored locally on your device
- **Idle Detection**: Automatically pauses tracking when you're away from your computer
- **Responsive Design**: Works seamlessly across different screen sizes

## Installation

### Development Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   cd web-activity-tracker
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` folder from your project

### Production Build

1. Build for production:
   ```bash
   npm run build
   ```

2. The built extension will be in the `dist` folder, ready for distribution

## Usage

### Getting Started

1. **Install the Extension**: Follow the installation steps above
2. **Grant Permissions**: The extension will request permissions for tabs, storage, and idle detection
3. **Start Tracking**: The extension automatically begins tracking your activity

### Accessing Features

- **Popup**: Click the extension icon in the toolbar to see today's stats and top sites
- **Dashboard**: Click "Dashboard" in the popup or navigate to the extension's dashboard page
- **Settings**: Click "Settings" to configure tracking preferences and manage data

### Setting Time Limits

1. Open the Dashboard or Settings page
2. Navigate to the "Site Limits" section
3. Click "Add Limit"
4. Enter a domain (e.g., `facebook.com`) or regex pattern
5. Set your daily time limit in seconds
6. Save the limit

### Viewing Statistics

The dashboard provides several views:
- **Time Overview**: Line chart showing activity over time
- **Time Distribution**: Pie chart of time spent across top sites
- **Top Sites List**: Detailed breakdown of most visited websites
- **Daily/Weekly/Monthly Views**: Switch between different time periods

## Configuration

### Settings Options

- **Idle Timeout**: Time before user is considered idle (default: 60 seconds)
- **Data Retention**: How long to keep activity data (default: 90 days)
- **Tracking Exclusions**: Domains to exclude from tracking
- **Theme**: Light or dark mode preference

### Data Management

- **Export Data**: Download all activity data as JSON
- **Import Data**: Restore data from a backup file
- **Clear All Data**: Permanently delete all tracked data
- **Reset Settings**: Restore default configuration

## Technical Details

### Architecture

- **Background Service Worker**: Handles core tracking logic and data persistence
- **Content Scripts**: Injected into pages for activity monitoring and blocking
- **Popup Interface**: Quick access to stats and settings
- **Dashboard**: Full-featured statistics and configuration interface
- **Options Page**: Extension settings and data management

### Data Storage

- **IndexedDB**: Activity logs and detailed tracking data
- **Chrome Storage**: Settings, site limits, and cached statistics
- **Local Processing**: All data processed and stored locally

### Privacy

- No data is sent to external servers
- All tracking happens locally in your browser
- You have full control over your data
- Export functionality for data portability

## Development

### Project Structure

```
web-activity-tracker/
├── src/
│   ├── background.ts          # Service worker
│   ├── content.ts             # Content script
│   ├── popup/                 # Popup interface
│   ├── dashboard/             # Statistics dashboard
│   ├── options/               # Settings page
│   ├── lib/                   # Core libraries
│   │   ├── storage/           # Data persistence
│   │   ├── patterns/          # URL pattern matching
│   │   └── utils/             # Helper functions
│   └── blocked.html           # Blocked page
├── public/
│   └── icons/                 # Extension icons
└── package.json
```

### Technologies Used

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Dexie.js**: IndexedDB wrapper
- **Recharts**: Data visualization
- **Vite**: Build tool

### Building

```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Lint code
npm run lint
```

## Troubleshooting

### Common Issues

1. **Extension not loading**: Check that all permissions are granted in `chrome://extensions/`
2. **Tracking not working**: Ensure the extension has permission to access the tabs
3. **Charts not displaying**: Check browser console for errors and ensure all dependencies are loaded

### Debugging

1. Open Chrome DevTools for the extension:
   - Go to `chrome://extensions/`
   - Find "Web Activity Tracker" and click "Service worker" to open background script DevTools
   - Right-click the popup and select "Inspect" to debug popup interface

2. Check console logs for error messages
3. Verify data in Chrome Storage: `chrome://extensions/` → Developer mode → Extension options → Storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or feature requests, please create an issue in the project repository.

---

**Note**: This extension is designed for personal productivity and digital wellbeing. Please use it responsibly and take regular breaks from screen time.