#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPackage() {
  try {
    console.log('📦 Creating extension package...');
    
    // Get version from package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;
    
    // Build the extension first
    console.log('🔨 Building extension...');
    execSync('pnpm run build', { stdio: 'inherit' });
    
    // Create ZIP file
    const distPath = path.join(__dirname, '../dist');
    const zipFileName = `web-activity-tracker-v${version}.zip`;
    const zipPath = path.join(__dirname, '..', zipFileName);
    
    console.log(`📁 Creating ZIP: ${zipFileName}`);
    
    // Change to dist directory and create ZIP
    process.chdir(distPath);
    execSync(`zip -r ../${zipFileName} .`, { stdio: 'inherit' });
    
    // Change back to original directory
    process.chdir(__dirname);
    
    // Verify ZIP was created
    if (fs.existsSync(zipPath)) {
      const stats = fs.statSync(zipPath);
      console.log(`✅ Package created successfully!`);
      console.log(`📄 File: ${zipFileName}`);
      console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      // List contents
      console.log('\n📋 Package contents:');
      execSync(`unzip -l ${zipPath}`, { stdio: 'inherit' });
      
      return zipPath;
    } else {
      throw new Error('ZIP file was not created');
    }
  } catch (error) {
    console.error('❌ Error creating package:', error.message);
    process.exit(1);
  }
}

function validatePackage(zipPath) {
  console.log('\n🔍 Validating package...');
  
  try {
    // Check file size (Chrome Web Store limit is 128MB)
    const stats = fs.statSync(zipPath);
    const sizeMB = stats.size / 1024 / 1024;
    
    if (sizeMB > 128) {
      console.warn('⚠️  Warning: Package size exceeds 128MB limit');
    } else {
      console.log(`✅ Package size: ${sizeMB.toFixed(2)} MB (within limits)`);
    }
    
    // Check if manifest exists in the ZIP
    const manifestCheck = execSync(`unzip -l ${zipPath} | grep manifest.json`, { encoding: 'utf8' });
    if (manifestCheck.trim()) {
      console.log('✅ manifest.json found in package');
    } else {
      throw new Error('manifest.json not found in package');
    }
    
    console.log('✅ Package validation passed');
  } catch (error) {
    console.error('❌ Package validation failed:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const validate = args.includes('--validate');
  
  const zipPath = createPackage();
  
  if (validate) {
    validatePackage(zipPath);
  }
}

export { createPackage, validatePackage };