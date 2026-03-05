import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include yt-dlp binary in serverless function bundle
  outputFileTracingIncludes: {
    '/api/stream': ['./bin/**'],
    '/api/audio-proxy': ['./bin/**'],
  },
};

export default nextConfig;
