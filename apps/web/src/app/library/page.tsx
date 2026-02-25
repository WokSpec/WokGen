import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Asset Library | WokGen',
  description: 'All your generated and saved assets in one place.',
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  const assets = await prisma.galleryAsset.findMany({
    where: { job: { userId } },
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: { job: { select: { userId: true } } },
  }).catch(() => []);

  const totalCount = await prisma.galleryAsset.count({
    where: { job: { userId } },
  }).catch(() => 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Asset Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {totalCount} asset{totalCount !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/gallery" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Gallery View
          </Link>
        </div>
      </div>

      {assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 1.25rem', borderRadius: '12px', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No assets yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>Generate your first asset in WokGen Studio and it will appear here.</p>
          <Link href="/studio" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>Open WokGen Studio</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {totalCount > 60 && (
        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Showing 60 of {totalCount} assets.{' '}
          <Link href="/gallery" style={{ color: '#a78bfa' }}>View all in Gallery</Link>
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset }: { asset: { id: string; imageUrl: string; thumbUrl: string | null; prompt: string; tool: string; mode: string } }) {
  const displayUrl = asset.thumbUrl ?? asset.imageUrl;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ aspectRatio: '1', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', position: 'relative' }}>
        {displayUrl && (
          <Image src={displayUrl} alt={asset.prompt?.slice(0, 60) || 'Asset'} fill className="object-cover" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" />
        )}
      </div>
      <div style={{ padding: '0.75rem' }}>
        {asset.prompt && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {asset.prompt}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{asset.mode || 'pixel'}</span>
          {asset.imageUrl && (
            <a href={asset.imageUrl} download target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#a78bfa', textDecoration: 'none' }}>Download</a>
          )}
        </div>
      </div>
    </div>
  );
}
