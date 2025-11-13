#!/bin/bash

# Release Script for Web Activity Tracker
# Creates a git tag and triggers the release workflow

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/release.sh <version>"
    echo "Example: ./scripts/release.sh 0.0.2"
    exit 1
fi

# Validate version format
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format x.y.z (e.g., 0.0.2)"
    exit 1
fi

echo "🚀 Releasing Web Activity Tracker v$VERSION"

# Run tests and build
echo "🔨 Running tests and build..."
npm run lint
npm run build

# Update package.json version
echo "📝 Updating package.json version..."
npm version $VERSION --no-git-tag-version

# Commit version change
echo "📤 Committing version change..."
git add package.json
git commit -m "chore: bump version to $VERSION"

# Create and push tag
echo "🏷️  Creating and pushing tag..."
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "✅ Release triggered! Check GitHub Actions for progress."
echo "📦 Release will be available at: https://github.com/crystalphantom/web-activity-tracker/releases/tag/v$VERSION"