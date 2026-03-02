import { NextRequest, NextResponse } from 'next/server'
import { db, experiments } from '@abkit/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

const patchExperimentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['draft', 'running', 'paused', 'complete']).optional(),
  goalType: z.enum(['click', 'pageview', 'form_submit', 'custom']).optional(),
  goalSelector: z.string().max(255).nullable().optional(),
  trafficAllocation: z.number().int().min(1).max(100).optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error, workspace } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const exp = await db.query.experiments.findFirst({
    where: and(eq(experiments.id, id), eq(experiments.workspaceId, workspace!.id)),
    with: { variants: true },
  })

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  return NextResponse.json(exp)
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error, workspace } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const exp = await db.query.experiments.findFirst({
    where: and(eq(experiments.id, id), eq(experiments.workspaceId, workspace!.id)),
  })

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  const body = await req.json() as unknown
  const parsed = patchExperimentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const [updated] = await db
    .update(experiments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(experiments.id, id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error, workspace } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const exp = await db.query.experiments.findFirst({
    where: and(eq(experiments.id, id), eq(experiments.workspaceId, workspace!.id)),
  })

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  if (exp.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft experiments can be deleted' },
      { status: 400 }
    )
  }

  await db.delete(experiments).where(eq(experiments.id, id))
  return NextResponse.json({ success: true })
}
