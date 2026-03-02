import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLAN_CONFIG } from '@/lib/stripe'
import { db, subscriptions } from '@abkit/db'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Stripe webhook needs raw body
export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    const rawBody = await req.text()
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = (session.metadata?.plan ?? 'free') as 'starter' | 'pro'

        if (!userId) break

        const planConfig = PLAN_CONFIG[plan]
        await db
          .insert(subscriptions)
          .values({
            userId,
            plan,
            experimentLimit: planConfig.experimentLimit,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: 'active',
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              plan,
              experimentLimit: planConfig.experimentLimit,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'active',
              updatedAt: new Date(),
            },
          })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const subId = subscription.id

        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price.id
        let plan: 'free' | 'starter' | 'pro' = 'free'
        if (priceId === process.env.STRIPE_PRICE_STARTER) plan = 'starter'
        else if (priceId === process.env.STRIPE_PRICE_PRO) plan = 'pro'

        const planConfig = PLAN_CONFIG[plan]
        // Use items.data[0].current_period_end (Stripe v20 pattern)
        // Fall back to subscription.current_period_end for older API versions
        const rawPeriodEnd = (subscription.items.data[0] as { current_period_end?: number } | undefined)?.current_period_end
          ?? (subscription as unknown as { current_period_end?: number }).current_period_end
        const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null

        const stripeStatus = subscription.status
        const status: 'active' | 'canceled' | 'past_due' =
          stripeStatus === 'past_due' ? 'past_due' :
          stripeStatus === 'canceled' ? 'canceled' : 'active'

        await db
          .update(subscriptions)
          .set({
            plan,
            experimentLimit: planConfig.experimentLimit,
            stripeSubscriptionId: subId,
            status,
            currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId))
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await db
          .update(subscriptions)
          .set({
            plan: 'free',
            experimentLimit: 3,
            stripeSubscriptionId: null,
            status: 'canceled',
            currentPeriodEnd: null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId))
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
