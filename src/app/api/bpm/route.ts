import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyToken } from '@/lib/spotify';

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  if (!title) {
    return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
  }

  try {
    const token = await getSpotifyToken();

    // Search for the track on Spotify
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?${new URLSearchParams({ q: title, type: 'track', limit: '1' })}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!searchRes.ok) throw new Error('Spotify search failed');
    const searchData = await searchRes.json();
    const track = searchData.tracks?.items?.[0];
    if (!track) {
      return NextResponse.json({ bpm: null, source: 'not_found' });
    }

    // Get audio features for BPM
    const featuresRes = await fetch(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!featuresRes.ok) throw new Error('Failed to get audio features');
    const features = await featuresRes.json();

    return NextResponse.json({
      bpm: Math.round(features.tempo),
      key: features.key,
      energy: features.energy,
      spotifyTitle: track.name,
      spotifyArtist: track.artists?.[0]?.name,
      source: 'spotify',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, bpm: null }, { status: 500 });
  }
}
