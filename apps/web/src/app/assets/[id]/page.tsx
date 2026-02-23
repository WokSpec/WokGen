import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// /assets/[id] — Shareable asset permalink page
//
// Publicly accessible (no auth required) for public gallery assets.
// Private assets return 404 unless the viewer owns them.
// ---------------------------------------------------------------------------

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const asset = await getAsset(params.id);
  if (!asset) return { title: 'Asset not found — WokGen' };

  const title = asset.title || asset.prompt.slice(0, 60);
  return {
    title:       `${title} — WokGen`,
    description: asset.prompt,
    openGraph: {
      title,
      description: asset.prompt,
      images:      [{ url: asset.imageUrl, width: 1200, height: 630, alt: title }],
      type:        'website',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description: asset.prompt,
      images:      [asset.imageUrl],
    },
  };
}

async function getAsset(id: string) {
  return prisma.galleryAsset.findFirst({
    where:  { id, isPublic: true },
    select: {
      id:        true,
      jobId:     true,
      title:     true,
      prompt:    true,
      tool:      true,
      rarity:    true,
      imageUrl:  true,
      tags:      true,
      createdAt: true,
      job: {
        select: {
          provider:  true,
          seed:      true,
          width:     true,
          height:    true,
          mode:      true,
          user: { select: { name: true, image: true } },
        },
      },
    },
  });
}

const RARITY_COLORS: Record<string, string> = {
  common:    '#6b7280',
  uncommon:  '#22c55e',
  rare:      '#3b82f6',
  epic:      '#a855f7',
  legendary: '#f59e0b',
};

export default async function AssetPage({ params }: Props) {
  const asset = await getAsset(params.id);
  if (!asset) notFound();

  const rarityColor = RARITY_COLORS[asset.rarity ?? 'common'] ?? '#6b7280';
  const shareUrl    = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/assets/${asset.id}`;
  const author      = asset.job?.user?.name ?? 'WokGen user';

  return (
    <div className="asset-permalink">
      <div className="asset-permalink__container">

        {/* Image */}
        <div className="asset-permalink__image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.imageUrl}
            alt={asset.title ?? asset.prompt}
            className="asset-permalink__image result-reveal"
          />
          <div className="asset-permalink__rarity" style={{ background: rarityColor }}>
            {asset.rarity ?? 'common'}
          </div>
        </div>

        {/* Info */}
        <div className="asset-permalink__info">
          <div className="asset-permalink__meta">
            <span className="asset-permalink__tool">{asset.tool ?? asset.job?.mode ?? 'AI'}</span>
            {asset.job?.provider && (
              <span className="asset-permalink__provider">{asset.job.provider}</span>
            )}
          </div>

          <h1 className="asset-permalink__title">
            {asset.title || asset.prompt.slice(0, 80)}
          </h1>

          <p className="asset-permalink__prompt">{asset.prompt}</p>

          {asset.tags && (
            <div className="asset-permalink__tags">
              {(() => {
                try {
                  const parsed: string[] = JSON.parse(asset.tags);
                  return parsed.slice(0, 8).map((tag: string) => (
                    <span key={tag} className="asset-permalink__tag">#{tag}</span>
                  ));
                } catch { return null; }
              })()}
            </div>
          )}

          <div className="asset-permalink__attrs">
            {asset.job?.width && asset.job.height && (
              <span>{asset.job.width} × {asset.job.height}</span>
            )}
            {asset.job?.seed && (
              <span>Seed {asset.job.seed}</span>
            )}
            <span>by {author}</span>
            <span>{new Date(asset.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Actions */}
          <div className="asset-permalink__actions">
            <a
              href={asset.imageUrl}
              download={`${(asset.title ?? asset.tool ?? 'asset').replace(/\s+/g, '_')}.png`}
              className="btn btn--primary"
            >
              ↓ Download
            </a>
            <AssetShareButton shareUrl={shareUrl} />
            <a
              href={`/pixel/studio?prompt=${encodeURIComponent(asset.prompt)}`}
              className="btn btn--ghost"
            >
              ↻ Remix in Studio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client-only share button (copy to clipboard)
function AssetShareButton({ shareUrl }: { shareUrl: string }) {
  // Using a form trick to work without 'use client'
  return (
    <button
      className="btn btn--ghost"
      onClick={undefined}
      // Handled via inline onclick for server component compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...{ onclick: `navigator.clipboard.writeText('${shareUrl}').then(()=>{this.textContent='Copied!';setTimeout(()=>{this.textContent='⇧ Share'},2000)}).catch(()=>{})` } as any}
    >
      ⇧ Share
    </button>
  );
}
