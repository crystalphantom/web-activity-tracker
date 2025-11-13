#!/bin/bash

# Build and Release Script for Web Activity Tracker
# This script builds the extension and creates a GitHub release

set -e

# Configuration
REPO_OWNER="crystalphantom"  # Replace with your GitHub username
REPO_NAME="web-activity-tracker"  # Replace with your repo name
VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="web-activity-tracker-v${VERSION}.zip"

echo "🔨 Building Web Activity Tracker v${VERSION}..."

# Clean previous builds
rm -rf dist/
rm -f *.zip

# Build the extension
npm run build

# Copy manifest and icons to dist if not already there
cp public/icons/* dist/icons/ 2>/dev/null || true
cp public/manifest.json dist/ 2>/dev/null || true

# Create zip file for distribution
echo "📦 Creating distribution package..."
cd dist
zip -r "../${ZIP_NAME}" .
cd ..

echo "✅ Build complete! Created ${ZIP_NAME}"
echo ""
echo "📋 To create a GitHub release:"
echo "1. Go to https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/new"
echo "2. Tag: v${VERSION}"
echo "3. Title: Web Activity Tracker v${VERSION}"
echo "4. Upload ${ZIP_NAME} as a release asset"
echo ""
echo "🌐 Download URL will be:"
echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${VERSION}/${ZIP_NAME}"