import { NextRequest, NextResponse } from 'next/server'
import { db, experiments, variants } from '@abkit/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

const patchVariantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  targetSelector: z.string().max(255).nullable().optional(),
  htmlContent: z.string().nullable().optional(),
  cssOverride: z.string().nullable().optional(),
  redirectUrl: z.string().url().nullable().optional(),
  weight: z.number().int().min(0).max(100).optional(),
})

type RouteParams = { params: Promise<{ id: string; variantId: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error, workspace } = await getAuthenticatedUser()
  if (error) return error

  const { id, variantId } = await params

  // Verify experiment ownership
  const exp = await db.query.experiments.findFirst({
    where: and(eq(experiments.id, id), eq(experiments.workspaceId, workspace!.id)),
  })

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  const variant = await db.query.variants.findFirst({
    where: and(eq(variants.id, variantId), eq(variants.experimentId, id)),
  })

  if (!variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
  }

  const body = await req.json() as unknown
  const parsed = patchVariantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [updated] = await db
    .update(variants)
    .set(parsed.data)
    .where(eq(variants.id, variantId))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error, workspace } = await getAuthenticatedUser()
  if (error) return error

  const { id, variantId } = await params

  // Verify experiment ownership
  const exp = await db.query.experiments.findFirst({
    where: and(eq(experiments.id, id), eq(experiments.workspaceId, workspace!.id)),
  })

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  const variant = await db.query.variants.findFirst({
    where: and(eq(variants.id, variantId), eq(variants.experimentId, id)),
  })

  if (!variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
  }

  if (variant.isControl) {
    return NextResponse.json({ error: 'Cannot delete control variant' }, { status: 400 })
  }

  await db.delete(variants).where(eq(variants.id, variantId))
  return NextResponse.json({ success: true })
}
