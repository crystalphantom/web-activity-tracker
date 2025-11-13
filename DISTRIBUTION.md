# Web Activity Tracker - Distribution Setup

## Quick Start for Sharing Your Extension

### 1. Update Configuration
Edit these files and replace `your-username` with your actual GitHub username:

- `scripts/build-and-release.sh` (line 6)
- `scripts/install.sh` (line 6) 
- `scripts/install.bat` (line 6)
- `INSTALL.md` (multiple lines)

### 2. Build and Create Release
```bash
npm run release
```

This will:
- Build your extension
- Create a zip file: `web-activity-tracker-v1.0.0.zip`
- Show you the GitHub release URL

### 3. Create GitHub Release
1. Go to the provided GitHub releases URL
2. Create a new release with tag `v1.0.0`
3. Upload the generated zip file

### 4. Share with Friends
Give them this one-liner:

**Mac/Linux:**
```bash
curl -sSL https://raw.githubusercontent.com/your-username/web-activity-tracker/main/scripts/install.sh | bash
```

**Windows:**
```powershell
iwr -useb https://raw.githubusercontent.com/your-username/web-activity-tracker/main/scripts/install.bat | cmd
```

## What Friends Get
- Automatic download and extraction
- Clear Chrome loading instructions  
- No technical knowledge required
- Works on all major platforms

## Version Updates
When you release a new version:
1. Update version in `package.json`
2. Update `VERSION` in install scripts
3. Run `npm run release`
4. Create new GitHub release with new tag