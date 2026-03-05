import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400, headers: CORS_HEADERS });
  }

  // Fetch the stream URL from our stream endpoint
  const origin = req.nextUrl.origin;
  const streamRes = await fetch(`${origin}/api/stream?videoId=${videoId}`);
  if (!streamRes.ok) {
    return NextResponse.json(
      { error: 'Failed to get stream URL', fallback: true },
      { status: 502, headers: CORS_HEADERS },
    );
  }

  const { url: audioUrl, contentType } = await streamRes.json();
  if (!audioUrl) {
    return NextResponse.json(
      { error: 'No audio URL', fallback: true },
      { status: 502, headers: CORS_HEADERS },
    );
  }

  // Forward Range header if present (required for <audio> seeking)
  const rangeHeader = req.headers.get('range');
  const fetchHeaders: Record<string, string> = {};
  if (rangeHeader) {
    fetchHeaders['Range'] = rangeHeader;
  }

  try {
    const upstream = await fetch(audioUrl, { headers: fetchHeaders });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: 'Upstream fetch failed', fallback: true },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    const responseHeaders: Record<string, string> = {
      ...CORS_HEADERS,
      'Content-Type': contentType || 'audio/webm',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    };

    // Forward content-range/content-length from upstream
    const contentRange = upstream.headers.get('content-range');
    const contentLength = upstream.headers.get('content-length');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    return new NextResponse(upstream.body, {
      status: upstream.status, // 200 or 206
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[/api/audio-proxy] fetch error:', err);
    return NextResponse.json(
      { error: 'Proxy error', fallback: true },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
