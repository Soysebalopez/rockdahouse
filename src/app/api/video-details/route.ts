import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { videoIds } = await req.json();

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: 'Missing videoIds array' }, { status: 400 });
    }

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    // videos.list costs only 1 unit (vs 100 for search) — batch up to 50 IDs
    const ids = videoIds.slice(0, 50).join(',');
    const params = new URLSearchParams({
      part: 'contentDetails',
      id: ids,
      key: API_KEY,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
    }

    const data = await res.json();
    const results: Record<string, { definition: 'hd' | 'sd'; duration: string }> = {};

    for (const item of data.items || []) {
      results[item.id] = {
        definition: item.contentDetails?.definition === 'hd' ? 'hd' : 'sd',
        duration: item.contentDetails?.duration || '',
      };
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
