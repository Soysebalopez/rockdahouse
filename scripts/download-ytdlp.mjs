/**
 * Downloads the yt-dlp standalone binary for the current platform.
 * Runs during `npm install` (postinstall) and before `next build`.
 * The binary is placed in ./bin/yt-dlp and is ~25MB.
 */

import { existsSync, mkdirSync, chmodSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = join(__dirname, '..', 'bin');
const BINARY_PATH = join(BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

// yt-dlp release — pin to a known working version
const VERSION = '2026.03.03';
const BASE_URL = `https://github.com/yt-dlp/yt-dlp/releases/download/${VERSION}`;

function getBinaryUrl() {
  switch (process.platform) {
    case 'darwin':
      return `${BASE_URL}/yt-dlp_macos`;
    case 'linux':
      return `${BASE_URL}/yt-dlp_linux`;
    case 'win32':
      return `${BASE_URL}/yt-dlp.exe`;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

async function main() {
  if (existsSync(BINARY_PATH)) {
    console.log(`[yt-dlp] Binary already exists at ${BINARY_PATH}`);
    return;
  }

  mkdirSync(BIN_DIR, { recursive: true });

  const url = getBinaryUrl();
  console.log(`[yt-dlp] Downloading from ${url}...`);

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download yt-dlp: ${res.status} ${res.statusText}`);
  }

  const fileStream = createWriteStream(BINARY_PATH);
  await pipeline(res.body, fileStream);

  if (process.platform !== 'win32') {
    chmodSync(BINARY_PATH, 0o755);
  }

  console.log(`[yt-dlp] Downloaded to ${BINARY_PATH}`);
}

main().catch((err) => {
  console.error('[yt-dlp] Download failed:', err.message);
  // Non-fatal: app will fall back to VIDEO ONLY mode
  process.exit(0);
});
