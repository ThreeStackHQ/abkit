import { NextRequest, NextResponse } from 'next/server'
import { db, workspaces, experiments } from '@abkit/db'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// In-memory rate limiter: sliding window 100 req/min per apiKey
const rateLimitMap = new Map<string, number[]>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(key) ?? []
  // Filter to window
  const recent = timestamps.filter((ts) => now - ts < windowMs)
  if (recent.length >= limit) return false
  recent.push(now)
  rateLimitMap.set(key, recent)
  return true
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get('apiKey')

  if (!apiKey) {
    return NextResponse.json({ error: 'apiKey required' }, { status: 400, headers: CORS_HEADERS })
  }

  // Rate limit: 100/min per apiKey
  if (!checkRateLimit(`experiments:${apiKey}`, 100, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: CORS_HEADERS })
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.apiKey, apiKey),
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: CORS_HEADERS })
  }

  const runningExperiments = await db.query.experiments.findMany({
    where: and(eq(experiments.workspaceId, workspace.id), eq(experiments.status, 'running')),
    with: { variants: true },
  })

  const result = runningExperiments.map((exp) => ({
    id: exp.id,
    name: exp.name,
    goalType: exp.goalType,
    goalSelector: exp.goalSelector,
    trafficAllocation: exp.trafficAllocation,
    variants: exp.variants.map((v) => ({
      id: v.id,
      name: v.name,
      isControl: v.isControl,
      targetSelector: v.targetSelector,
      htmlContent: v.htmlContent,
      cssOverride: v.cssOverride,
      redirectUrl: v.redirectUrl,
      weight: v.weight,
    })),
  }))

  return NextResponse.json({ experiments: result }, { headers: CORS_HEADERS })
}
