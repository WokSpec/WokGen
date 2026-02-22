/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---------------------------------------------------------------------------
  // Environment variable exposure
  // Variables prefixed with NEXT_PUBLIC_ are inlined at build time and
  // accessible on the client. Server-only vars are NOT listed here.
  // ---------------------------------------------------------------------------
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
  },

  // ---------------------------------------------------------------------------
  // Image optimisation — allowlist remote hostnames used by each provider
  // ---------------------------------------------------------------------------
  images: {
    remotePatterns: [
      // Replicate
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'pbxt.replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: '**.replicate.delivery',
      },
      // fal.ai
      {
        protocol: 'https',
        hostname: '**.fal.run',
      },
      {
        protocol: 'https',
        hostname: '**.fal.ai',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/fal-flux-sc/**',
      },
      // Together.ai CDN (b64_json is used by default, but URL mode is a fallback)
      {
        protocol: 'https',
        hostname: '**.together.xyz',
      },
      {
        protocol: 'https',
        hostname: '**.together.ai',
      },
      // Hugging Face (some Replicate outputs)
      {
        protocol: 'https',
        hostname: 'cdn-lfs.huggingface.co',
      },
      {
        protocol: 'https',
        hostname: '**.huggingface.co',
      },
      // Local ComfyUI — data URIs are handled in code, but allow localhost
      // for cases where ComfyUI serves images via URL
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Docker internal host (Mac/Windows Docker Desktop)
      {
        protocol: 'http',
        hostname: 'host.docker.internal',
      },
    ],
    // Pixel art assets look best uncompressed — keep quality high
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // ---------------------------------------------------------------------------
  // Prisma + heavy native modules must run in the Node.js runtime, not Edge
  // ---------------------------------------------------------------------------
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

  // ---------------------------------------------------------------------------
  // CORS headers for the API — allow cross-origin requests from Studio UI
  // embedded in other apps or called directly (e.g. from CLI tools).
  // ---------------------------------------------------------------------------
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true'                                   },
          { key: 'Access-Control-Allow-Origin',      value: process.env.CORS_ORIGIN ?? (process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org') : '*') },
          { key: 'Access-Control-Allow-Methods',     value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS'      },
          {
            key:   'Access-Control-Allow-Headers',
            value: [
              'X-CSRF-Token',
              'X-Requested-With',
              'Accept',
              'Accept-Version',
              'Content-Length',
              'Content-MD5',
              'Content-Type',
              'Date',
              'X-Api-Version',
              'Authorization',
              'X-Provider-Key',
              'X-Provider',
            ].join(', '),
          },
        ],
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // Redirects — keep old paths working if ever restructured
  // ---------------------------------------------------------------------------
  async redirects() {
    return [
      // Convenience alias
      { source: '/generate', destination: '/studio', permanent: false },
      { source: '/art',      destination: '/gallery', permanent: false },
    ];
  },

  // ---------------------------------------------------------------------------
  // Standalone output — for Docker/self-hosted builds only.
  // Disabled for Vercel (Vercel manages its own output format).
  // Uncomment this line if building a Docker image:
  // output: 'standalone',
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Webpack customisation
  // ---------------------------------------------------------------------------
  webpack(config, { isServer }) {
    // Exclude server-only Prisma files from the client bundle
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:     false,
        net:    false,
        tls:    false,
        crypto: false,
      };
    }
    return config;
  },

  // ---------------------------------------------------------------------------
  // TypeScript / ESLint build behaviour
  // ---------------------------------------------------------------------------
  typescript: {
    // Type errors are caught by the CI tsc step; do not block production builds.
    ignoreBuildErrors: true,
  },

  eslint: {
    // Lint is run as a separate CI step; do not block production builds.
    ignoreDuringBuilds: true,
  },

  // Reduce build output noise
  poweredByHeader: false,
};

module.exports = nextConfig;
