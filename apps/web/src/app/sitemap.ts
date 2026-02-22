import type { MetadataRoute } from 'next';

// ---------------------------------------------------------------------------
// WokGen — sitemap.xml generation via Next.js App Router metadata API
//
// Generated file is served at /sitemap.xml automatically by Next.js.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
// ---------------------------------------------------------------------------

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000';

  const now = new Date();

  return [
    {
      url:              `${baseUrl}/`,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${baseUrl}/studio`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${baseUrl}/gallery`,
      lastModified:     now,
      changeFrequency:  'daily',
      priority:         0.8,
    },
    {
      url:              `${baseUrl}/docs`,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         0.7,
    },
    {
      url:              `${baseUrl}/terms`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.3,
    },
    {
      url:              `${baseUrl}/privacy`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.3,
    },
  ];
}
