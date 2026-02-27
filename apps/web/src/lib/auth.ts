import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import type { NextAuthConfig } from 'next-auth';

// ---------------------------------------------------------------------------
// NextAuth v5 configuration
// ---------------------------------------------------------------------------

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      checks: ['pkce', 'state'],
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      checks: ['pkce', 'state'],
    }),
  ],

  // JWT strategy: session is stored in an HTTP-only cookie (encrypted with
  // AUTH_SECRET). No DB round-trip on every request — sessions survive
  // server restarts and page refreshes reliably.
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    // Persist the DB user.id + isAdmin into the JWT (one DB hit at sign-in,
    // then read from the encrypted cookie on every subsequent request).
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        // Load isAdmin once when the token is first minted
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true },
        }).catch(() => null);
        token.isAdmin = dbUser?.isAdmin ?? false;
      }
      return token;
    },
    // Expose user id + isAdmin in session so client components can read it
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        (session.user as { id: string; isAdmin?: boolean }).isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },

  events: {
    // Auto-provision a Free subscription the first time any user signs in
    async signIn({ user, isNewUser }) {
      if (!isNewUser) return;
      if (!user.id) return;

      try {
        const existing = await prisma.subscription.findUnique({
          where: { userId: user.id },
        });
        if (existing) return;

        // Ensure the free plan row exists (idempotent upsert)
        await prisma.plan.upsert({
          where:  { id: 'free' },
          create: { id: 'free', name: 'Free', priceUsdCents: 0, creditsPerMonth: 0, isUnlimitedStd: true },
          update: {},
        });

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await prisma.subscription.create({
          data: {
            userId:             user.id,
            planId:             'free',
            status:             'active',
            currentPeriodStart: now,
            currentPeriodEnd:   periodEnd,
          },
        });

        // Send welcome email (no-op if RESEND_API_KEY not set)
        if (user.email) {
          await sendWelcomeEmail(user.email, user.name ?? undefined).catch(() => {});
        }
      } catch (err) {
        // Non-fatal: log but never block sign-in over a subscription provisioning failure
        console.error('[auth] Failed to provision Free subscription for new user:', err);
      }
    },
  },
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
