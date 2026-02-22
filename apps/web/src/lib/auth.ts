import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GitHub from 'next-auth/providers/github';
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
    // Persist the DB user.id into the JWT so we can read it without a DB call
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    // Expose user id in session so API routes can read it
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  events: {
    // Auto-provision a Free subscription the first time any user signs in
    async signIn({ user, isNewUser }) {
      if (!isNewUser) return;
      if (!user.id) return;

      const existing = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });
      if (existing) return;

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      await prisma.subscription.create({
        data: {
          userId:            user.id,
          planId:            'free',
          status:            'active',
          currentPeriodStart: now,
          currentPeriodEnd:  periodEnd,
        },
      });

      // Send welcome email (no-op if RESEND_API_KEY not set)
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name ?? undefined).catch(() => {});
      }
    },
  },
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
