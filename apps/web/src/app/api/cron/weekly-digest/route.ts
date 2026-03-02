import { NextRequest, NextResponse } from 'next/server'
import { db, experiments, variants, visitors, workspaces, users } from '@abkit/db'
import { eq, and, count, sql } from 'drizzle-orm'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Verify CRON_SECRET header
  const cronSecret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL ?? 'abkit@abkit.threestack.io'

  // Get all users with workspaces
  const allWorkspaces = await db.query.workspaces.findMany({
    with: { user: true },
  })

  let sent = 0
  let errors = 0

  for (const workspace of allWorkspaces) {
    if (!workspace.user?.email) continue

    // Get running experiments for this workspace
    const runningExperiments = await db.query.experiments.findMany({
      where: and(
        eq(experiments.workspaceId, workspace.id),
        eq(experiments.status, 'running')
      ),
      with: { variants: true },
    })

    if (runningExperiments.length === 0) continue

    // Gather stats for each experiment
    type ExperimentDigest = {
      id: string
      name: string
      totalVisitors: number
      bestConversionRate: number
      bestVariantName: string
    }

    const experimentStats: ExperimentDigest[] = []

    for (const exp of runningExperiments) {
      let totalVisitors = 0
      let bestRate = 0
      let bestVariantName = 'Control'

      for (const variant of exp.variants) {
        const [stats] = await db
          .select({
            visitors: count(visitors.id),
            conversions: sql<number>`sum(case when ${visitors.converted} = true then 1 else 0 end)::int`,
          })
          .from(visitors)
          .where(eq(visitors.variantId, variant.id))

        const v = stats?.visitors ?? 0
        const c = stats?.conversions ?? 0
        totalVisitors += v
        const rate = v > 0 ? (c / v) * 100 : 0
        if (rate > bestRate) {
          bestRate = rate
          bestVariantName = variant.name
        }
      }

      experimentStats.push({
        id: exp.id,
        name: exp.name,
        totalVisitors,
        bestConversionRate: Number(bestRate.toFixed(2)),
        bestVariantName,
      })
    }

    // Top performer
    const topPerformer = experimentStats.reduce(
      (best, curr) => curr.bestConversionRate > best.bestConversionRate ? curr : best,
      experimentStats[0]
    )

    // Low traffic experiments (<100 visitors)
    const lowTraffic = experimentStats.filter((e) => e.totalVisitors < 100)

    const lowTrafficHtml = lowTraffic.length > 0
      ? `<div style="background:#0f0a1e;border-radius:8px;padding:16px;margin-top:16px">
          <p style="color:#f59e0b;font-size:13px;font-weight:600;margin:0 0 8px">⚠️ Experiments needing more traffic (&lt;100 visitors)</p>
          ${lowTraffic.map((e) => `<p style="color:#94a3b8;font-size:13px;margin:4px 0">• ${e.name} — ${e.totalVisitors} visitors</p>`).join('')}
        </div>`
      : ''

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0f0a1e;color:#e2e8f0;font-family:system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="background:#1a1035;border:1px solid #2d1f5e;border-radius:16px;padding:40px">
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#7c3aed;border-radius:12px;font-size:22px">📊</div>
        <h1 style="color:#fff;font-size:22px;margin:16px 0 4px">Your Weekly A/B Digest</h1>
        <p style="color:#94a3b8;font-size:14px;margin:0">Here's how your experiments are performing</p>
      </div>

      <div style="background:#0f0a1e;border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">Running Experiments</p>
        <p style="color:#fff;font-size:32px;font-weight:700;margin:0">${runningExperiments.length}</p>
      </div>

      ${topPerformer ? `
      <div style="background:#0f0a1e;border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">🏆 Top Performer</p>
        <p style="color:#7c3aed;font-size:16px;font-weight:600;margin:0">${topPerformer.name}</p>
        <p style="color:#10b981;font-size:14px;margin:4px 0 0">Best variant: ${topPerformer.bestVariantName} — ${topPerformer.bestConversionRate}% CVR</p>
        <p style="color:#94a3b8;font-size:12px;margin:4px 0 0">${topPerformer.totalVisitors} total visitors</p>
      </div>
      ` : ''}

      ${lowTrafficHtml}

      <div style="text-align:center;margin-top:24px">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none">View Dashboard →</a>
      </div>
    </div>
    <p style="text-align:center;color:#4a5568;font-size:12px;margin-top:24px">AbKit · A/B testing for indie hackers</p>
  </div>
</body>
</html>
    `

    try {
      await resend.emails.send({
        from,
        to: workspace.user.email,
        subject: '📊 Your AbKit Weekly Experiment Digest',
        html,
      })
      sent++
    } catch (err) {
      console.error(`Failed to send digest to ${workspace.user.email}:`, err)
      errors++
    }
  }

  return NextResponse.json({ sent, errors, total: allWorkspaces.length })
}
