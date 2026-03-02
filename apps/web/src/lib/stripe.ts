import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return stripeInstance
}

export const PLAN_CONFIG: Record<string, { experimentLimit: number; name: string }> = {
  free: { experimentLimit: 3, name: 'Free' },
  starter: { experimentLimit: 5, name: 'Starter' },
  pro: { experimentLimit: -1, name: 'Pro' },
}
