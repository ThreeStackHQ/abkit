import { NextRequest, NextResponse } from 'next/server'
import { db, experiments, variants, visitors, subscriptions, workspaces } from '@abkit/db'
import { eq, and, count, sql } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// Error function approximation for normalCDF (no external libs)
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const t = 1.0 / (1.0 + p * absX)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)
  return sign * y
}

function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)))
}

function calcZTest(
  visitors1: number,
  conversions1: number,
  visitors2: number,
  conversions2: number
): { zScore: number; pValue: number; significant: boolean } {
  if (visitors1 === 0 || visitors2 === 0) {
    return { zScore: 0, pValue: 1, significant: false }
  }

  const p1 = conversions1 / visitors1
  const p2 = conversions2 / visitors2
  const pPool = (conversions1 + conversions2) / (visitors1 + visitors2)

  if (pPool === 0 || pPool === 1) {
    return { zScore: 0, pValue: 1, significant: false }
  }

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / visitors1 + 1 / visitors2))
  if (se === 0) {
    return { zScore: 0, pValue: 1, significant: false }
  }

  const z = (p1 - p2) / se
  const pValue = 2 * (1 - normalCDF(Math.abs(z)))
  return { zScore: z, pValue, significant: pValue < 0.05 }
}

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error, userId, workspace } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params

  const exp = await db.query.experiments.findFirst({
    where: and(eq(experiments.id, id), eq(experiments.workspaceId, workspace!.id)),
    with: { variants: true },
  })

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  // Get visitor + conversion counts per variant
  const variantStats = await Promise.all(
    exp.variants.map(async (v) => {
      const [stats] = await db
        .select({
          visitors: count(visitors.id),
          conversions: sql<number>`sum(case when ${visitors.converted} = true then 1 else 0 end)::int`,
        })
        .from(visitors)
        .where(eq(visitors.variantId, v.id))

      const visitorCount = stats?.visitors ?? 0
      const conversionCount = stats?.conversions ?? 0
      const conversionRate =
        visitorCount > 0 ? Number(((conversionCount / visitorCount) * 100).toFixed(2)) : 0

      return {
        variantId: v.id,
        variantName: v.name,
        isControl: v.isControl,
        visitors: visitorCount,
        conversions: conversionCount,
        conversionRate,
      }
    })
  )

  // Find control variant
  const controlVariant = variantStats.find((v) => v.isControl)
  const nonControlVariants = variantStats.filter((v) => !v.isControl)

  let overallZScore = 0
  let overallPValue = 1
  let overallSignificant = false

  // Compare each non-control vs control
  if (controlVariant) {
    for (const variant of nonControlVariants) {
      const { zScore, pValue, significant } = calcZTest(
        variant.visitors,
        variant.conversions,
        controlVariant.visitors,
        controlVariant.conversions
      )
      // Use worst-case p-value across comparisons (largest z-score = most significant)
      if (Math.abs(zScore) > Math.abs(overallZScore)) {
        overallZScore = zScore
        overallPValue = pValue
        overallSignificant = significant
      }
    }
  }

  // Determine winner
  let winner: string | null = null
  if (overallSignificant) {
    const best = variantStats.reduce((prev, curr) =>
      curr.conversionRate > prev.conversionRate ? curr : prev
    )
    winner = best.variantId
  }

  // Send significance alert email (Sprint 3.2)
  if (overallSignificant && !exp.hasAlertSent && winner) {
    // Mark alert as sent first to avoid duplicate sends
    await db
      .update(experiments)
      .set({ hasAlertSent: true })
      .where(eq(experiments.id, id))

    // Get workspace owner's email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const user = await db.query.users.findFirst({
        where: (users) => eq(users.id, userId!),
      })

      if (user?.email) {
        const winningVariant = variantStats.find((v) => v.variantId === winner)
        const controlVariantData = variantStats.find((v) => v.isControl)

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'abkit@abkit.threestack.io',
          to: user.email,
          subject: '🎉 AbKit: Your experiment found a winner!',
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0f0a1e;color:#e2e8f0;font-family:system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="background:#1a1035;border:1px solid #2d1f5e;border-radius:16px;padding:40px">
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#7c3aed;border-radius:12px;font-size:24px">🎉</div>
        <h1 style="color:#fff;font-size:24px;margin:16px 0 8px">A Winner Has Been Found!</h1>
        <p style="color:#94a3b8;margin:0">Statistical significance reached for your experiment</p>
      </div>
      
      <div style="background:#0f0a1e;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">Experiment</p>
        <p style="color:#fff;font-size:18px;font-weight:600;margin:0">${exp.name}</p>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
        <div style="background:#0f0a1e;border-radius:8px;padding:16px">
          <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">🏆 Winner</p>
          <p style="color:#7c3aed;font-size:16px;font-weight:600;margin:0">${winningVariant?.variantName ?? 'N/A'}</p>
          <p style="color:#10b981;font-size:14px;margin:4px 0 0">${winningVariant?.conversionRate ?? 0}% conversion</p>
        </div>
        <div style="background:#0f0a1e;border-radius:8px;padding:16px">
          <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">📊 Control</p>
          <p style="color:#e2e8f0;font-size:16px;font-weight:600;margin:0">${controlVariantData?.variantName ?? 'Control'}</p>
          <p style="color:#94a3b8;font-size:14px;margin:4px 0 0">${controlVariantData?.conversionRate ?? 0}% conversion</p>
        </div>
      </div>
      
      <div style="background:#0f0a1e;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">Statistical Significance</p>
        <p style="color:#10b981;font-size:14px;margin:0">p-value: ${overallPValue.toFixed(4)} (p &lt; 0.05 ✓)</p>
      </div>
      
      <div style="text-align:center">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/experiments/${id}/results" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none">View Full Results →</a>
      </div>
    </div>
    
    <p style="text-align:center;color:#4a5568;font-size:12px;margin-top:24px">AbKit · A/B testing for indie hackers · <a href="${process.env.NEXTAUTH_URL}" style="color:#7c3aed">abkit.threestack.io</a></p>
  </div>
</body>
</html>
          `,
        })
      }
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Failed to send significance alert:', emailError)
    }
  }

  return NextResponse.json({
    variants: variantStats,
    winner,
    significant: overallSignificant,
    pValue: Number(overallPValue.toFixed(4)),
    zScore: Number(overallZScore.toFixed(4)),
    controlVariantId: controlVariant?.variantId ?? null,
  })
}
