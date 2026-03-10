import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/audio-url': ['./bin/**'],
  },
};

export default nextConfig;
