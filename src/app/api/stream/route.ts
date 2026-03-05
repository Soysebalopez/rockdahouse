import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';
export const maxDuration = 30;

// In-memory cache: videoId → { url, contentType, expiresAt }
const cache = new Map<string, { url: string; contentType: string; expiresAt: number }>();
const TTL = 5 * 60 * 60 * 1000; // 5h (YouTube URLs expire ~6h)

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

// Find yt-dlp binary
function getYtdlpPath(): string | null {
  // Check project bin/ directory first
  const projectBin = join(process.cwd(), 'bin', 'yt-dlp');
  if (existsSync(projectBin)) return projectBin;

  // Fallback: check if yt-dlp is in PATH (e.g., installed via brew)
  return 'yt-dlp';
}

// Build cookies file path if env var exists
function getCookiesArgs(): string[] {
  const cookiesFile = process.env.YOUTUBE_COOKIES_FILE;
  if (cookiesFile && existsSync(cookiesFile)) {
    return ['--cookies', cookiesFile];
  }
  return [];
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  evictExpired();

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached);
  }

  const ytdlp = getYtdlpPath();
  if (!ytdlp) {
    return NextResponse.json({ error: 'yt-dlp not available', fallback: true }, { status: 500 });
  }

  try {
    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-check-certificates',
      '--format', 'bestaudio',
      '--no-playlist',
      ...getCookiesArgs(),
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    const { stdout } = await execFileAsync(ytdlp, args, {
      timeout: 25000, // 25s timeout (route has 30s max)
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const info = JSON.parse(stdout);
    const url = info.url;

    if (!url) {
      return NextResponse.json({ error: 'No audio URL in yt-dlp output', fallback: true }, { status: 404 });
    }

    const ext = info.ext || 'webm';
    const contentType = ext === 'webm' ? 'audio/webm'
      : ext === 'opus' ? 'audio/ogg'
      : ext === 'm4a' ? 'audio/mp4'
      : 'audio/mp4';

    const entry = { url, contentType, expiresAt: Date.now() + TTL };
    cache.set(videoId, entry);
    return NextResponse.json(entry);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/stream] yt-dlp error:', message);
    return NextResponse.json({ error: 'Failed to extract audio', fallback: true }, { status: 500 });
  }
}
