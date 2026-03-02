import { auth } from '@/auth'
import { db, workspaces, subscriptions } from '@abkit/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), userId: null as null, workspace: null as null }
  }
  const userId = session.user.id

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  })

  if (!workspace) {
    return { error: NextResponse.json({ error: 'Workspace not found' }, { status: 404 }), userId: null as null, workspace: null as null }
  }

  return { error: null, userId, workspace }
}

export async function getUserSubscription(userId: string) {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  return sub
}
