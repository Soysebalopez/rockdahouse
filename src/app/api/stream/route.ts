import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export const runtime = 'nodejs';

// In-memory cache: videoId → { url, contentType, expiresAt }
const cache = new Map<string, { url: string; contentType: string; expiresAt: number }>();
const TTL = 5 * 60 * 60 * 1000; // 5 hours (URLs expire ~6h)

// Evict expired entries periodically
function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  evictExpired();

  // Return cached URL if still valid
  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      url: cached.url,
      contentType: cached.contentType,
      expiresAt: cached.expiresAt,
    });
  }

  try {
    const info = await ytdl.getInfo(videoId);

    // Pick highest quality audio-only format
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    if (audioFormats.length === 0) {
      return NextResponse.json({ error: 'No audio formats available', fallback: true }, { status: 404 });
    }

    // Sort by bitrate descending, prefer opus/webm for browser compat
    const sorted = audioFormats.sort((a, b) => (b.audioBitrate ?? 0) - (a.audioBitrate ?? 0));
    const format = sorted[0];

    const entry = {
      url: format.url,
      contentType: format.mimeType?.split(';')[0] ?? 'audio/webm',
      expiresAt: Date.now() + TTL,
    };

    cache.set(videoId, entry);

    return NextResponse.json(entry);
  } catch (err) {
    console.error('[/api/stream] ytdl error:', err);
    return NextResponse.json({ error: 'Failed to extract audio', fallback: true }, { status: 500 });
  }
}
