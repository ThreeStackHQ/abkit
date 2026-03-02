import { NextRequest, NextResponse } from 'next/server'
import { db, experiments, variants } from '@abkit/db'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getAuthenticatedUser, getUserSubscription } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

const createExperimentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  goalType: z.enum(['click', 'pageview', 'form_submit', 'custom']).optional(),
  goalSelector: z.string().max(255).optional(),
  trafficAllocation: z.number().int().min(1).max(100).optional(),
})

export async function GET() {
  const { error, workspace } = await getAuthenticatedUser()
  if (error) return error

  const rows = await db
    .select({
      id: experiments.id,
      name: experiments.name,
      description: experiments.description,
      status: experiments.status,
      goalType: experiments.goalType,
      goalSelector: experiments.goalSelector,
      trafficAllocation: experiments.trafficAllocation,
      hasAlertSent: experiments.hasAlertSent,
      createdAt: experiments.createdAt,
      updatedAt: experiments.updatedAt,
      variantCount: sql<number>`count(${variants.id})::int`,
    })
    .from(experiments)
    .leftJoin(variants, eq(variants.experimentId, experiments.id))
    .where(eq(experiments.workspaceId, workspace!.id))
    .groupBy(experiments.id)
    .orderBy(experiments.createdAt)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { error, userId, workspace } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json() as unknown
  const parsed = createExperimentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Check subscription limit
  const sub = await getUserSubscription(userId!)
  if (sub && sub.experimentLimit !== -1) {
    const count = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(experiments)
      .where(eq(experiments.workspaceId, workspace!.id))
    const currentCount = count[0]?.count ?? 0
    if (currentCount >= sub.experimentLimit) {
      return NextResponse.json(
        { error: 'Experiment limit reached. Upgrade your plan to create more experiments.' },
        { status: 402 }
      )
    }
  }

  const data = parsed.data

  const [exp] = await db.insert(experiments).values({
    workspaceId: workspace!.id,
    name: data.name,
    description: data.description,
    goalType: data.goalType ?? 'click',
    goalSelector: data.goalSelector,
    trafficAllocation: data.trafficAllocation ?? 100,
  }).returning()

  // Auto-create 2 variants: Control + Variant A
  await db.insert(variants).values([
    {
      experimentId: exp.id,
      name: 'Control',
      isControl: true,
      weight: 50,
    },
    {
      experimentId: exp.id,
      name: 'Variant A',
      isControl: false,
      weight: 50,
    },
  ])

  const experimentWithVariants = await db.query.experiments.findFirst({
    where: eq(experiments.id, exp.id),
    with: { variants: true },
  })

  return NextResponse.json(experimentWithVariants, { status: 201 })
}
