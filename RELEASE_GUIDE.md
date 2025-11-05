# Chrome Extension Release Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build & Package
```bash
pnpm run package:validate
```

### 3. Create Release Tag
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 4. GitHub Actions will automatically:
- Build and validate the extension
- Create ZIP package
- Upload to Chrome Web Store
- Create GitHub Release

## 🔧 Manual Release Process

### Local Testing
```bash
# Build extension
pnpm run build

# Create package
pnpm run package

# Validate package
pnpm run package:validate
```

### Manual Upload
```bash
# Set environment variables
export CHROME_CLIENT_ID="your-client-id"
export CHROME_CLIENT_SECRET="your-client-secret" 
export CHROME_REFRESH_TOKEN="your-refresh-token"

# Upload to Chrome Web Store
pnpm run upload <extension-id> web-activity-tracker-v1.0.0.zip
```

## 🔐 Chrome Web Store API Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Chrome Web Store API"

### 2. Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Add authorized redirect URI: `https://developers.chrome.com/oauth2/redirect`
5. Save Client ID and Client Secret

### 3. Get Refresh Token
1. Visit: `https://developers.chrome.com/docs/webstore/using-api#authorization`
2. Use the OAuth playground to get refresh token
3. Store refresh token securely

### 4. GitHub Repository Secrets
Add these secrets to your GitHub repository:
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`
- `CHROME_EXTENSION_ID` (optional, for auto-upload)

## 📋 Release Checklist

### Before Release
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test extension locally
- [ ] Run `pnpm run lint` (no warnings)
- [ ] Run `pnpm run package:validate`

### After Release
- [ ] Verify Chrome Web Store listing
- [ ] Test published extension
- [ ] Monitor for issues
- [ ] Update documentation if needed

## 🔄 Version Management

### Automatic Version Sync
The build process automatically syncs versions between:
- `package.json` (source of truth)
- `public/manifest.json` (auto-updated)

### Semantic Versioning
- `MAJOR.MINOR.PATCH`
- Use `npm version` to bump versions
- Tags should match version format: `v1.0.0`

## 📦 Package Structure

The generated ZIP includes:
```
dist/
├── manifest.json
├── background.js
├── content.js
├── src/
│   ├── popup/
│   ├── dashboard/
│   └── options/
├── icons/
└── blocked.html
```

## 🚨 Troubleshooting

### Common Issues
1. **Build fails**: Check `pnpm run lint` output
2. **Upload fails**: Verify API credentials and extension ID
3. **Package too large**: Check bundle size, optimize assets
4. **Manifest errors**: Validate manifest.json syntax

### Debug Commands
```bash
# Check build output
ls -la dist/

# Validate manifest
cat dist/manifest.json

# Check package contents
unzip -l web-activity-tracker-v*.zip
```

## 📊 Release Metrics

Monitor:
- Chrome Web Store downloads
- Extension ratings and reviews
- Error reports in Chrome Developer Dashboard
- GitHub release analytics