# Development Commands

## Build and Development
- `pnpm run build` - Production build (TypeScript compile + Vite build)
- `pnpm run dev` - Development build with hot reload
- `pnpm run lint` - ESLint with TypeScript rules, max 0 warnings

## Testing
- No test framework currently configured
- Add tests before implementing test commands

## Extension Testing
1. Build extension: `pnpm run build`
2. Load in Chrome: 
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist` folder
3. Test functionality on YouTube.com

## Git Commands
- `git status` - Check working tree status
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git push` - Push to remote

## File Operations
- `ls -la` - List files with details
- `find . -name "*.ts" -o -name "*.tsx"` - Find TypeScript files
- `grep -r "pattern" src/` - Search in source files
- `rg "pattern" src/` - Faster search with ripgrep

## Chrome Extension Debugging
- Background script: `chrome://extensions/` → Service worker link
- Popup: Right-click extension icon → Inspect
- Content script: Regular DevTools on target webpage