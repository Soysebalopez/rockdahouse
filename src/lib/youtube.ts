import type { Track } from './types';

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// YouTube Data API v3: 10,000 units/day, search costs 100 units each
const DAILY_SEARCH_LIMIT = 100;
const STORAGE_KEY = 'rockdahouse-yt-usage';

interface UsageData {
  date: string; // YYYY-MM-DD
  count: number;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: UsageData = JSON.parse(raw);
      if (data.date === getToday()) return data;
    }
  } catch { /* ignore */ }
  return { date: getToday(), count: 0 };
}

function incrementUsage(): void {
  const usage = getUsage();
  usage.count++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function getSearchesRemaining(): number {
  return Math.max(0, DAILY_SEARCH_LIMIT - getUsage().count);
}

export async function searchYouTube(query: string): Promise<Track[]> {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('YouTube API key not configured');
  }

  if (getSearchesRemaining() <= 0) {
    throw new Error('Daily search limit reached (100/day). Resets at midnight.');
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

  incrementUsage();
  const data = await res.json();

  return (data.items || []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.default.url,
  }));
}
