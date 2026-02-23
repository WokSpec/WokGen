import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const now  = new Date();

  return [
    // Platform root
    { url: `${base}/`,                    lastModified: now, changeFrequency: 'weekly',   priority: 1.0 },

    // Pixel mode
    { url: `${base}/pixel`,               lastModified: now, changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${base}/pixel/studio`,        lastModified: now, changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${base}/pixel/gallery`,       lastModified: now, changeFrequency: 'daily',    priority: 0.8 },

    // Business mode
    { url: `${base}/business`,            lastModified: now, changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${base}/business/studio`,     lastModified: now, changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${base}/business/gallery`,    lastModified: now, changeFrequency: 'daily',    priority: 0.8 },

    // Coming soon / beta
    { url: `${base}/vector`,              lastModified: now, changeFrequency: 'monthly',  priority: 0.5 },
    { url: `${base}/emoji`,               lastModified: now, changeFrequency: 'monthly',  priority: 0.5 },
    { url: `${base}/uiux`,                lastModified: now, changeFrequency: 'monthly',  priority: 0.5 },

    // Voice mode (beta)
    { url: `${base}/voice`,               lastModified: now, changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${base}/voice/studio`,        lastModified: now, changeFrequency: 'monthly',  priority: 0.65 },
    { url: `${base}/voice/gallery`,       lastModified: now, changeFrequency: 'daily',    priority: 0.6 },

    // Text mode (beta)
    { url: `${base}/text`,                lastModified: now, changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${base}/text/studio`,         lastModified: now, changeFrequency: 'monthly',  priority: 0.65 },
    { url: `${base}/text/gallery`,        lastModified: now, changeFrequency: 'daily',    priority: 0.6 },

    // Eral — AI companion
    { url: `${base}/eral`,                lastModified: now, changeFrequency: 'weekly',   priority: 0.75 },

    // Docs
    { url: `${base}/docs`,                lastModified: now, changeFrequency: 'weekly',   priority: 0.7 },
    { url: `${base}/docs/pixel`,          lastModified: now, changeFrequency: 'weekly',   priority: 0.65 },
    { url: `${base}/docs/business`,       lastModified: now, changeFrequency: 'weekly',   priority: 0.65 },
    { url: `${base}/docs/platform/billing`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },

    // Legal
    { url: `${base}/terms`,               lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${base}/privacy`,             lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
  ];
}
