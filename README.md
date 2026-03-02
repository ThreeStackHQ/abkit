# AbKit — A/B Testing for Indie Hackers

> Test headlines, CTAs, and pricing pages in 5 minutes. Google Optimize at 1/30th the price.

**$9/mo** · No analytics PhD required · Works on any website

## The Problem

Google Optimize shut down in September 2023. What's left?
- **Optimizely** — $299/mo (overkill)
- **VWO** — $199/mo (still expensive)
- **PostHog** — Free but complex, requires event schema setup
- **Nothing clean at $9/mo** for indie hackers

## The Solution

AbKit is a 1-script-tag A/B testing tool built for indie hackers:

- **5-minute setup** — add one script tag, create experiment in dashboard
- **Visual element targeting** — pick any element on your page to test
- **Conversion tracking** — clicks, form submits, page views, or custom events
- **Statistical significance** — know when your results are real
- **Stripe integration** — track checkout conversions out of the box

## Quick Start

```html
<!-- Add to your site -->
<script defer src="https://cdn.abkit.threestack.io/widget.js"
  data-api-key="ak_live_your_key_here">
</script>
```

That's it. Create your experiment at [abkit.threestack.io](https://abkit.threestack.io).

## Manual Conversions

```javascript
// Track a custom conversion event
window.abkit?.convert()

// Track conversion for a specific experiment
window.abkit?.convert('exp_xyz123')
```

## Architecture

```
abkit/
├── apps/
│   ├── web/          # Next.js 14 dashboard + API
│   └── worker/       # BullMQ worker (email digests)
├── packages/
│   ├── db/           # Drizzle schema (PostgreSQL)
│   └── widget/       # Vanilla JS widget (<3KB)
```

## Pricing

| | Free | Starter | Pro |
|---|---|---|---|
| Experiments | 1 | 5 | Unlimited |
| Visitors/mo | 10K | 100K | Unlimited |
| Workspaces | 1 | 1 | 3 |
| Email reports | ❌ | ✅ | ✅ |
| **Price** | **Free** | **$9/mo** | **$29/mo** |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Drizzle ORM
- **Queue:** BullMQ + Redis (Upstash)
- **Auth:** NextAuth v5 (GitHub + Google)
- **Payments:** Stripe
- **Email:** Resend
- **Widget:** Vanilla JS (<3KB, TypeScript compiled)
- **Monorepo:** Turborepo + pnpm

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

- **Web:** [abkit.threestack.io](https://abkit.threestack.io) (Vercel)
- **Worker:** [worker.abkit.threestack.io](https://worker.abkit.threestack.io) (Coolify)
- **CDN:** [cdn.abkit.threestack.io](https://cdn.abkit.threestack.io) (Cloudflare R2)

---

Part of the [ThreeStack](https://threestack.io) suite of indie hacker tools.
