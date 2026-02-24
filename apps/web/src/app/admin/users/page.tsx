import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users — Admin | WokGen' };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, email: true },
  });
  const isAdmin =
    currentUser?.isAdmin ||
    (process.env.ADMIN_EMAIL && currentUser?.email === process.env.ADMIN_EMAIL);
  if (!isAdmin) redirect('/');

  const page = parseInt(searchParams.page || '1');
  const q = searchParams.q || '';
  const perPage = 25;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        isAdmin: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Users</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {total} total users
          </p>
        </div>
        <form style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email..."
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.5rem 0.875rem',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              width: '240px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Search
          </button>
        </form>
      </div>

      <div
        style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {['User', 'Email', 'Joined', 'Role'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <td style={{ padding: '0.875rem 1rem' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                  >
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt=""
                        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(167,139,250,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#a78bfa',
                        }}
                      >
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-primary)' }}>{user.name || 'No name'}</span>
                  </div>
                </td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                  {user.email || '-'}
                </td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  {user.isAdmin ? (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.625rem',
                        borderRadius: '999px',
                        background: 'rgba(167,139,250,0.12)',
                        color: '#a78bfa',
                        border: '1px solid rgba(167,139,250,0.2)',
                      }}
                    >
                      Admin
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users found.
          </div>
        )}
      </div>

      {total > perPage && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1.5rem',
          }}
        >
          {page > 1 && (
            <a
              href={`?q=${q}&page=${page - 1}`}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Previous
            </a>
          )}
          <span style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Page {page} of {Math.ceil(total / perPage)}
          </span>
          {page < Math.ceil(total / perPage) && (
            <a
              href={`?q=${q}&page=${page + 1}`}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
