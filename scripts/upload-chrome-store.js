#!/usr/bin/env node

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChromeWebStoreUploader {
  constructor(clientId, clientSecret, refreshToken) {
    this.auth = new GoogleAuth({
      clientId: clientId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      scopes: ['https://www.googleapis.com/auth/chromewebstore']
    });
  }

  async uploadExtension(extensionId, zipFilePath, publish = true) {
    try {
      const authClient = await this.auth.getClient();
      const chromeWebStore = google.chromewebstore({ version: 'v1.1', auth: authClient });

      console.log(`📤 Uploading extension ${extensionId}...`);

      // Upload the ZIP file
      const uploadResponse = await chromeWebStore.items.update({
        itemId: extensionId,
        media: {
          mimeType: 'application/zip',
          body: fs.createReadStream(zipFilePath)
        }
      });

      console.log('✅ Extension uploaded successfully');

      if (publish) {
        console.log('🚀 Publishing to Chrome Web Store...');
        
        // Publish the extension
        const publishResponse = await chromeWebStore.items.publish({
          itemId: extensionId,
          requestBody: {
            target: 'default',
            releaseNotes: this.getReleaseNotes()
          }
        });

        console.log('✅ Extension published successfully');
        console.log(`Status: ${publishResponse.data.status[0]}`);
        
        if (publishResponse.data.status[0] === 'OK') {
          console.log('🎉 Extension is now live in the Chrome Web Store!');
        }
      }

      return uploadResponse.data;
    } catch (error) {
      console.error('❌ Error uploading extension:', error.message);
      throw error;
    }
  }

  getReleaseNotes() {
    const changelogPath = path.join(__dirname, '../CHANGELOG.md');
    if (fs.existsSync(changelogPath)) {
      const changelog = fs.readFileSync(changelogPath, 'utf8');
      // Extract the latest version section
      const match = changelog.match(/## \[.*?\].*?\n\n(.*?)(?=\n## |\n---|$)/s);
      if (match) {
        return match[1].trim();
      }
    }
    return 'Bug fixes and improvements';
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node upload-chrome-store.js <extension-id> <zip-file> [publish]');
    console.log('Environment variables: CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN');
    process.exit(1);
  }

  const [extensionId, zipFile, publishFlag] = args;
  const publish = publishFlag !== 'false';

  const clientId = process.env.CHROME_CLIENT_ID;
  const clientSecret = process.env.CHROME_CLIENT_SECRET;
  const refreshToken = process.env.CHROME_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const uploader = new ChromeWebStoreUploader(clientId, clientSecret, refreshToken);
  uploader.uploadExtension(extensionId, zipFile, publish)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default ChromeWebStoreUploader;