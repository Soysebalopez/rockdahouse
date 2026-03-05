import type { Track } from './types';

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export async function searchYouTube(query: string): Promise<Track[]> {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('YouTube API key not configured');
  }

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    maxResults: '15',
    q: query,
    key: API_KEY,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.items || []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.default.url,
  }));
}
