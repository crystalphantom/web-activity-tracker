# 🚀 Automated Release System

Your extension now has a fully automated CI/CD pipeline!

## 📋 How It Works

### Automatic Triggers:
1. **Push a tag** → Creates GitHub release automatically
2. **Manual dispatch** → Trigger release from GitHub Actions tab

### What the Pipeline Does:
- ✅ Runs linting and tests
- ✅ Builds the extension
- ✅ Creates zip file
- ✅ Generates GitHub release
- ✅ Uploads assets
- ✅ Updates install scripts with new version
- ✅ Provides installation instructions

## 🎯 How to Release New Versions

### Method 1: Git Tag (Recommended)
```bash
# Create and push a tag
git tag -a v0.0.2 -m "Release v0.0.2"
git push origin v0.0.2
```

### Method 2: Release Script
```bash
# Automated release with version bump
npm run release-version 0.0.2
```

### Method 3: Manual Trigger
1. Go to: https://github.com/crystalphantom/web-activity-tracker/actions
2. Click "Build and Release" workflow
3. Click "Run workflow"
4. Enter version number

## 📦 After Release

Your friends can install with:
```bash
curl -sSL https://raw.githubusercontent.com/crystalphantom/web-activity-tracker/main/scripts/install.sh | bash
```

The install scripts automatically use the latest version!

## 🔧 CI Pipeline

- **CI Workflow**: Runs on every push/PR to main
- **Release Workflow**: Runs on tags or manual dispatch
- **Artifacts**: Build files stored for 7 days

## 📁 Files Created

- `.github/workflows/ci.yml` - Continuous integration
- `.github/workflows/release.yml` - Automated releases
- `scripts/release.sh` - Release automation script

Your extension now has professional-grade automation! 🎉