#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../package.json');
const manifestJsonPath = path.join(__dirname, '../public/manifest.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

  const version = packageJson.version;
  
  if (manifestJson.version !== version) {
    manifestJson.version = version;
    fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2));
    console.log(`✅ Updated manifest.json version to ${version}`);
  } else {
    console.log(`✅ Versions already match: ${version}`);
  }
} catch (error) {
  console.error('❌ Error syncing versions:', error.message);
  process.exit(1);
}