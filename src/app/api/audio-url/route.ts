import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface CacheEntry {
  url: string;
  contentType: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 60 * 1000; // 5 hours

function findYtDlp(): string | null {
  // Check local bin first
  const localBin = path.join(process.cwd(), 'bin', 'yt-dlp');
  if (existsSync(localBin)) return localBin;
  // Fall back to system PATH
  return 'yt-dlp';
}

function extractAudioUrl(videoId: string): Promise<{ url: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const bin = findYtDlp();
    if (!bin) return reject(new Error('yt-dlp not found'));

    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    execFile(bin, [
      '--get-url',
      '-f', 'bestaudio',
      '--no-warnings',
      '--no-playlist',
      ytUrl,
    ], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      const url = stdout.trim();
      if (!url || !url.startsWith('http')) {
        return reject(new Error('Invalid URL returned by yt-dlp'));
      }
      // Detect content type from URL params
      const mime = url.includes('mime=audio%2Fwebm') ? 'audio/webm'
        : url.includes('mime=audio%2Fmp4') ? 'audio/mp4'
        : 'audio/webm';
      resolve({ url, contentType: mime });
    });
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      url: cached.url,
      contentType: cached.contentType,
      expiresAt: cached.expiresAt,
      cached: true,
    });
  }

  try {
    const { url, contentType } = await extractAudioUrl(videoId);
    const expiresAt = Date.now() + CACHE_TTL;
    cache.set(videoId, { url, contentType, expiresAt });

    // Evict old entries
    if (cache.size > 200) {
      const now = Date.now();
      for (const [key, entry] of cache) {
        if (entry.expiresAt < now) cache.delete(key);
      }
    }

    return NextResponse.json({ url, contentType, expiresAt });
  } catch (err) {
    console.warn('[audio-url] yt-dlp failed:', (err as Error).message);
    return NextResponse.json({ fallback: true, error: (err as Error).message }, { status: 200 });
  }
}
