import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyToken } from '@/lib/spotify';

export async function POST(req: NextRequest) {
  try {
    const { titles } = await req.json();

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({ error: 'Missing titles array' }, { status: 400 });
    }

    let token: string;
    try {
      token = await getSpotifyToken();
    } catch {
      // Spotify credentials not configured — return empty results gracefully
      const empty: Record<string, { bpm: null }> = {};
      for (const t of titles.slice(0, 15)) {
        empty[t] = { bpm: null };
      }
      return NextResponse.json({ results: empty, warning: 'Spotify credentials not configured' });
    }
    const results: Record<string, { bpm: number | null }> = {};

    // Process titles in parallel (max 15 at a time to avoid rate limits)
    const batch = titles.slice(0, 15);

    await Promise.all(
      batch.map(async (title: string) => {
        try {
          // Search for track on Spotify
          const searchRes = await fetch(
            `https://api.spotify.com/v1/search?${new URLSearchParams({ q: title, type: 'track', limit: '1' })}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!searchRes.ok) {
            results[title] = { bpm: null };
            return;
          }

          const searchData = await searchRes.json();
          const track = searchData.tracks?.items?.[0];

          if (!track) {
            results[title] = { bpm: null };
            return;
          }

          // Get audio features
          const featuresRes = await fetch(
            `https://api.spotify.com/v1/audio-features/${track.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!featuresRes.ok) {
            results[title] = { bpm: null };
            return;
          }

          const features = await featuresRes.json();
          results[title] = { bpm: features.tempo ? Math.round(features.tempo) : null };
        } catch {
          results[title] = { bpm: null };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
