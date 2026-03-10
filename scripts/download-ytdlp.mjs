#!/usr/bin/env node
/**
 * Downloads the yt-dlp binary for the current platform.
 * Runs as postinstall / prebuild script.
 * Skips if binary already exists.
 */

import { existsSync, mkdirSync, chmodSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binDir = path.join(__dirname, '..', 'bin');
const platform = process.platform;

const URLS = {
  darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
  linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
  win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
};

const binName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const binPath = path.join(binDir, binName);

if (existsSync(binPath)) {
  console.log(`[yt-dlp] Binary already exists at ${binPath}`);
  process.exit(0);
}

const url = URLS[platform];
if (!url) {
  console.warn(`[yt-dlp] Unsupported platform: ${platform}. Skipping download.`);
  process.exit(0);
}

try {
  mkdirSync(binDir, { recursive: true });
  console.log(`[yt-dlp] Downloading for ${platform}...`);
  execFileSync('curl', ['-L', '-o', binPath, url], { stdio: 'inherit', timeout: 120000 });
  if (platform !== 'win32') {
    chmodSync(binPath, 0o755);
  }
  console.log(`[yt-dlp] Downloaded to ${binPath}`);
} catch (err) {
  console.warn(`[yt-dlp] Download failed: ${err.message}. App will try system yt-dlp.`);
}
