# Web Activity Tracker - Quick Install

## One-Command Installation

### Mac/Linux
```bash
curl -sSL https://raw.githubusercontent.com/crystalphantom/web-activity-tracker/main/scripts/install.sh | bash
```

### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/crystalphantom/web-activity-tracker/main/scripts/install.bat | cmd
```

## Manual Installation

1. **Download the extension:**
   ```bash
   # Mac/Linux
   curl -L -o extension.zip "https://github.com/crystalphantom/web-activity-tracker/releases/download/v1.0.0/web-activity-tracker-v1.0.0.zip"
   unzip extension.zip -d web-activity-tracker
   rm extension.zip
   
   # Windows
   curl -L -o extension.zip "https://github.com/crystalphantom/web-activity-tracker/releases/download/v1.0.0/web-activity-tracker-v1.0.0.zip"
   powershell -command "Expand-Archive -Path 'extension.zip' -DestinationPath 'web-activity-tracker'"
   del extension.zip
   ```

2. **Load in Chrome:**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `web-activity-tracker` folder

## What This Installs

- ✅ Built extension ready for Chrome
- ✅ All dependencies bundled
- ✅ No additional setup required
- ✅ Works offline after installation

## Need Help?

- Check the [main repository](https://github.com/crystalphantom/web-activity-tracker)
- Open an issue for installation problems