import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ name: username }, { email: username }] },
    select: { name: true, image: true },
  });
  if (!user) return { title: 'User not found — WokGen' };
  return {
    title: `${user.name ?? username} — WokGen`,
    description: `View ${user.name ?? username}'s public profile on WokGen.`,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { name: username },
        { email: { contains: username } },
      ],
    },
    select: { id: true, name: true, image: true, createdAt: true },
  });

  if (!user) notFound();

  const [recentJobs, totalCount] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id, status: 'succeeded', resultUrl: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, prompt: true, tool: true, mode: true, resultUrl: true, createdAt: true },
    }),
    prisma.job.count({ where: { userId: user.id, status: 'succeeded' } }),
  ]);

  const joinDate = user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const initial  = (user.name ?? '?')[0].toUpperCase();

  return (
    <main className="profile-page">
      <div className="profile-header">
        <div className="profile-header__inner">
          <div className="profile-header__avatar-wrap">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ''} width={80} height={80} className="profile-header__avatar" style={{ borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="profile-header__avatar profile-header__avatar--initials">{initial}</div>
            )}
          </div>
          <div className="profile-header__info">
            <h1 className="profile-header__name">{user.name ?? username}</h1>
            <p className="profile-header__meta">Member since {joinDate}</p>
            <div className="profile-header__stats-row">
              <span className="profile-header__stat"><strong>{totalCount.toLocaleString()}</strong> generations</span>
              {/* Placeholder follower counts */}
              <span className="profile-header__stat"><strong>0</strong> following</span>
              <span className="profile-header__stat"><strong>0</strong> followers</span>
            </div>
          </div>
          <div className="profile-header__actions">
            <button
              className="btn-ghost btn-sm"
              onClick={undefined}
              aria-label="Share profile"
            >
              Share profile
            </button>
          </div>
        </div>
      </div>

      <div className="profile-gallery">
        <h2 className="profile-gallery__title">Public Gallery</h2>
        {recentJobs.length === 0 ? (
          <p className="profile-gallery__empty">No public generations yet.</p>
        ) : (
          <div className="profile-gallery__grid">
            {recentJobs.map(job => (
              <div key={job.id} className="profile-gallery__item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.resultUrl ?? ''}
                  alt={job.prompt}
                  className="profile-gallery__img"
                  loading="lazy"
                />
                <div className="profile-gallery__overlay">
                  <p className="profile-gallery__prompt">{job.prompt.slice(0, 60)}{job.prompt.length > 60 ? '…' : ''}</p>
                  <span className="profile-gallery__mode">{job.mode ?? job.tool}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-back-link">
        <Link href="/gallery" className="acct-link">← Browse Gallery</Link>
      </div>
    </main>
  );
}
