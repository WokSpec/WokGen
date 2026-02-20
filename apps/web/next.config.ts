import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { hostname: 'replicate.delivery' },
      { hostname: 'fal.media' },
      { hostname: '*.r2.dev' },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_ALLOW_ANONYMOUS: process.env.NEXT_PUBLIC_ALLOW_ANONYMOUS || 'true',
  },
};

export default nextConfig;
