import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { db, subscriptions, users } from '@abkit/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro']),
})

export async function POST(req: NextRequest) {
  const { error, userId } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json() as unknown
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { plan } = parsed.data
  const priceId = plan === 'starter'
    ? process.env.STRIPE_PRICE_STARTER!
    : process.env.STRIPE_PRICE_PRO!

  const stripe = getStripe()

  // Get or create Stripe customer
  let sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId!),
  })

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId!),
  })

  let customerId = sub?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      metadata: { userId: userId! },
    })
    customerId = customer.id

    if (sub) {
      await db
        .update(subscriptions)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId!))
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
    metadata: { userId: userId!, plan },
  })

  return NextResponse.json({ url: session.url })
}
