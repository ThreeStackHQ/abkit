import { NextRequest, NextResponse } from 'next/server'
import { db, experiments, variants } from '@abkit/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

const addVariantSchema = z.object({
  name: z.string().min(1).max(255),
  targetSelector: z.string().max(255).optional(),
  htmlContent: z.string().optional(),
  cssOverride: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  weight: z.number().int().min(0).max(100).optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
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
  const parsed = addVariantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const [variant] = await db.insert(variants).values({
    experimentId: id,
    name: data.name,
    isControl: false,
    targetSelector: data.targetSelector,
    htmlContent: data.htmlContent,
    cssOverride: data.cssOverride,
    redirectUrl: data.redirectUrl,
    weight: data.weight ?? 50,
  }).returning()

  return NextResponse.json(variant, { status: 201 })
}
