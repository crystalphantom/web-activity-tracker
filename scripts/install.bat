@echo off
REM Install Script for Web Activity Tracker (Windows)
REM Downloads and sets up the extension for testing

setlocal enabledelayedexpansion

REM Configuration
set REPO_OWNER=crystalphantom
set REPO_NAME=web-activity-tracker
set VERSION=1.1.0
set ZIP_NAME=web-activity-tracker-v%VERSION%.zip
set EXTENSION_DIR=web-activity-tracker

echo 🚀 Installing Web Activity Tracker v%VERSION%...

REM Check if curl is available
curl --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: curl is not installed. Please install curl first.
    pause
    exit /b 1
)

REM Remove previous installation if exists
if exist "%EXTENSION_DIR%" (
    echo 🗑️  Removing previous installation...
    rmdir /s /q "%EXTENSION_DIR%"
)

REM Download the extension
echo ⬇️  Downloading from GitHub...
set DOWNLOAD_URL=https://github.com/%REPO_OWNER%/%REPO_NAME%/releases/download/v.%VERSION%/%ZIP_NAME%
curl -L -o "%ZIP_NAME%" "%DOWNLOAD_URL%"

REM Extract the extension
echo 📂 Extracting extension...
powershell -command "Expand-Archive -Path '%ZIP_NAME%' -DestinationPath '%EXTENSION_DIR%' -Force"

REM Clean up zip file
del "%ZIP_NAME%"

echo ✅ Installation complete!
echo.
echo 📋 Next steps:
echo 1. Open Chrome
echo 2. Go to chrome://extensions/
echo 3. Enable 'Developer mode' (toggle in top right)
echo 4. Click 'Load unpacked'
echo 5. Select the '%EXTENSION_DIR%' folder
echo.
echo 🎉 Your Web Activity Tracker is ready to use!
pause