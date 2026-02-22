import type { MetadataRoute } from 'next';

// ---------------------------------------------------------------------------
// WokGen — robots.txt generation via Next.js App Router metadata API
//
// Generated file is served at /robots.txt automatically by Next.js.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
// ---------------------------------------------------------------------------

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/studio',
          '/gallery',
          '/docs',
          '/terms',
          '/privacy',
        ],
        disallow: [
          '/api/',
          '/_next/',
          '/admin',
          '/account',
          '/billing',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host:    baseUrl,
  };
}
