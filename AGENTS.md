# Web Activity Tracker - Agent Guidelines

## Build Commands
- `pnpm run build` - Production build (TypeScript compile + Vite build)
- `pnpm run dev` - Development build with hot reload
- `pnpm run lint` - ESLint with TypeScript rules, max 0 warnings
- No test framework configured - add tests before implementing test commands

## Code Style Guidelines

### Imports & Dependencies
- Use absolute imports with `@/` alias for src directory
- Group imports: React hooks first, then local imports, then third-party
- Prefer named exports over default exports for utilities

### TypeScript & Types
- Strict TypeScript enabled with noUnusedLocals and noUnusedParameters
- Define interfaces in `src/lib/types.ts` for shared data structures
- Use Chrome extension types from `@types/chrome`

### React Patterns
- Functional components with hooks only
- Use useState for local state, useEffect for side effects
- Handle async operations in useEffect with try/catch
- Use Tailwind CSS for styling, avoid inline styles

### Error Handling
- Always wrap async operations in try/catch blocks
- Log errors with console.error for debugging
- Provide fallback UI states for loading/error conditions

### Chrome Extension Specific
- Use chrome.tabs.create() for navigation
- Use chrome.runtime.getURL() for internal resources
- Follow Chrome extension manifest v3 patterns
- Background script as service worker, content scripts for page injection

### Naming Conventions
- PascalCase for components and interfaces
- camelCase for functions, variables, and methods
- Use descriptive names that reflect purpose
- File names match component/function names (App.tsx, helpers.ts)

### Data Storage
- Use Dexie (IndexedDB wrapper) for activity logs
- Use Chrome storage API for settings and preferences
- Implement proper data cleanup and retention policies