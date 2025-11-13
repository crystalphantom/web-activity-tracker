#!/bin/bash

# Install Script for Web Activity Tracker
# Downloads and sets up the extension for testing

set -e

# Configuration
REPO_OWNER="crystalphantom"  # Replace with your GitHub username
REPO_NAME="web-activity-tracker"  # Replace with your repo name
VERSION="1.1.0"  # Update this when you release new versions
ZIP_NAME="web-activity-tracker-v${VERSION}.zip"
EXTENSION_DIR="web-activity-tracker"

echo "🚀 Installing Web Activity Tracker v${VERSION}..."

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ Error: curl is not installed. Please install curl first."
    exit 1
fi

# Check if unzip is available
if ! command -v unzip &> /dev/null; then
    echo "❌ Error: unzip is not installed. Please install unzip first."
    exit 1
fi

# Remove previous installation if exists
if [ -d "$EXTENSION_DIR" ]; then
    echo "🗑️  Removing previous installation..."
    rm -rf "$EXTENSION_DIR"
fi

# Download the extension
echo "⬇️  Downloading from GitHub..."
DOWNLOAD_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v.${VERSION}/${ZIP_NAME}"
curl -L -o "${ZIP_NAME}" "$DOWNLOAD_URL"

# Extract the extension
echo "📂 Extracting extension..."
unzip -q "${ZIP_NAME}" -d "$EXTENSION_DIR"

# Clean up zip file
rm "${ZIP_NAME}"

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Chrome"
echo "2. Go to chrome://extensions/"
echo "3. Enable 'Developer mode' (toggle in top right)"
echo "4. Click 'Load unpacked'"
echo "5. Select the '$EXTENSION_DIR' folder"
echo ""
echo "🎉 Your Web Activity Tracker is ready to use!"