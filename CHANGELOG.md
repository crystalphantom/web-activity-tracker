# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial Chrome extension setup
- Web activity tracking functionality
- Time limit setting for websites
- Dashboard for activity visualization
- Options page for configuration
- Popup interface for quick access

### Features
- Real-time activity tracking
- Website blocking when time limits reached
- Data persistence with IndexedDB
- Responsive UI with Tailwind CSS
- Chrome Manifest V3 compliance

### Technical
- React + TypeScript setup
- Vite build system
- pnpm package management
- ESLint configuration
- CI/CD pipeline with GitHub Actions

---

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of Web Activity Tracker
- Core tracking and blocking functionality
- User interface components
- Chrome Web Store submission

---

## How to Update This Changelog

When making changes:
1. Add new entries under the "Unreleased" section
2. Use the following categories:
   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for any bug fixes
   - `Security` for vulnerability fixes

3. When releasing:
   - Move "Unreleased" changes to a new version section
   - Add release date
   - Create new "Unreleased" section