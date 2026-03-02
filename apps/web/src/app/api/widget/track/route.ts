import { NextRequest, NextResponse } from 'next/server'
import { db, workspaces, visitors } from '@abkit/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// In-memory rate limiter: sliding window 500 req/min per apiKey
const rateLimitMap = new Map<string, number[]>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(key) ?? []
  const recent = timestamps.filter((ts) => now - ts < windowMs)
  if (recent.length >= limit) return false
  recent.push(now)
  rateLimitMap.set(key, recent)
  return true
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const trackSchema = z.object({
  apiKey: z.string().min(1),
  experimentId: z.string().uuid(),
  variantId: z.string().uuid(),
  visitorHash: z.string().min(1).max(64),
  // Support both 'event' (widget) and 'eventType' (spec)
  event: z.enum(['impression', 'conversion']).optional(),
  eventType: z.enum(['impression', 'conversion']).optional(),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown
  const parsed = trackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: CORS_HEADERS })
  }

  const { apiKey, experimentId, variantId, visitorHash } = parsed.data
  const eventType = parsed.data.eventType ?? parsed.data.event

  if (!eventType) {
    return NextResponse.json({ error: 'eventType or event required' }, { status: 400, headers: CORS_HEADERS })
  }

  // Rate limit: 500/min per apiKey
  if (!checkRateLimit(`track:${apiKey}`, 500, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: CORS_HEADERS })
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.apiKey, apiKey),
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: CORS_HEADERS })
  }

  if (eventType === 'impression') {
    // Upsert: dedup on experimentId + visitorHash
    await db
      .insert(visitors)
      .values({
        experimentId,
        variantId,
        visitorHash,
        converted: false,
      })
      .onConflictDoNothing()
  } else if (eventType === 'conversion') {
    // Update converted=true for existing visitor
    await db
      .update(visitors)
      .set({
        converted: true,
        convertedAt: new Date(),
      })
      .where(
        and(
          eq(visitors.experimentId, experimentId),
          eq(visitors.visitorHash, visitorHash)
        )
      )
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
}
