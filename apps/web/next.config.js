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
    unoptimized: false, // Enable Next.js image optimization for production
  },

  // ---------------------------------------------------------------------------
  // Compression for gzip/brotli
  // ---------------------------------------------------------------------------
  compress: true,

  // ---------------------------------------------------------------------------
  // Prisma + heavy native modules must run in the Node.js runtime, not Edge
  // Instrumentation hook for OpenTelemetry when OTEL_EXPORTER_OTLP_ENDPOINT is set
  // ---------------------------------------------------------------------------
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'edge-tts', 'ws'],
    instrumentationHook: true,
  },

  // ---------------------------------------------------------------------------
  // Redirects — keep old paths working if ever restructured
  // ---------------------------------------------------------------------------
  async redirects() {
    return [
      // Mode migration — preserve existing shared links
      { source: '/studio',  destination: '/pixel/studio',  permanent: false },
      { source: '/gallery', destination: '/pixel/gallery', permanent: false },
      // Legacy convenience aliases
      { source: '/generate', destination: '/pixel/studio', permanent: false },
      { source: '/art',      destination: '/pixel/gallery', permanent: false },
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
    const path = require('path');
    const webpack = require('webpack');

    if (isServer) {
      // edge-tts ships TypeScript source — must be external so webpack never bundles it
      const existingExternals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...existingExternals, 'edge-tts', 'ws'];
    }

    // Stub onnxruntime-web on both client and server — @imgly/background-removal
    // loads it dynamically at runtime via WebAssembly; its .mjs chunks cause
    // Terser "import/export outside module" errors when webpack tries to bundle them.
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /onnxruntime-web/,
        path.resolve(__dirname, 'src/lib/stubs/onnxruntime-stub.js')
      )
    );

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

  // ---------------------------------------------------------------------------
  // Security headers — applied to every response
  // ---------------------------------------------------------------------------
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control',     value: 'on' },
          ...(isProd ? [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          ] : []),
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js requires unsafe-eval for dev, unsafe-inline for hydration
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.replicate.delivery https://*.fal.run https://*.fal.ai https://storage.googleapis.com https://*.together.xyz https://*.together.ai https://*.huggingface.co https://cdn-lfs.huggingface.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
              "media-src 'self' blob: https://*.elevenlabs.io https://*.together.ai https://*.fal.run",
      "connect-src 'self' https://*.vercel-insights.com https://*.upstash.io https://api.stripe.com wss://speech.platform.bing.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
