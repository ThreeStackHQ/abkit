import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db, workspaces, subscriptions } from '@abkit/db'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'database' },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return
      // Auto-create workspace + subscription on first login
      const existing = await db.query.workspaces.findFirst({
        where: eq(workspaces.userId, user.id),
      })
      if (!existing) {
        const workspaceName = (user.name ?? user.email ?? 'My') + ' Workspace'
        await db.insert(workspaces).values({
          userId: user.id,
          name: workspaceName,
          apiKey: nanoid(32),
        })
        await db.insert(subscriptions).values({
          userId: user.id,
          plan: 'free',
          experimentLimit: 3,
        })
      }
    },
  },
  pages: {
    signIn: '/login',
  },
})
