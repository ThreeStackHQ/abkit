# AbKit — A/B Testing for Indie Hackers

> Test headlines, CTAs, and pricing pages in 5 minutes. Google Optimize at 1/30th the price.

## The Problem

Google Optimize shut down in September 2023. The alternatives? Optimizely ($299/mo), VWO ($199/mo), Adobe Target (enterprise). There's nothing clean for indie hackers who just want to test their landing page headline.

## The Solution

AbKit: dead simple A/B testing with a single `<script>` tag. No analytics PhD required.

```html
<script defer 
  src="https://cdn.abkit.threestack.io/widget.js"
  data-api-key="ak_live_xxxx">
</script>
```

That's it. Create experiments in the dashboard, pick what to test, watch the results roll in.

## Features

- **5-minute setup** — 1 script tag, works on any site
- **Visual element targeting** — CSS selector to pick what you're testing
- **Automatic 50/50 split** — configurable traffic allocation
- **Goal types**: click, pageview, form submit, custom event
- **Statistical significance** — Z-test with confidence intervals
- **Stripe conversion tracking** — `window.abkit.convert()` on checkout complete
- **Weekly email digest** — significant results delivered to your inbox
- **Privacy first** — no PII stored, GDPR compliant

## Pricing

| Plan | Price | Experiments | Visitors/mo |
|------|-------|-------------|-------------|
| Free | $0 | 1 | 10K |
| Starter | $9/mo | 5 | 100K |
| Pro | $29/mo | Unlimited | Unlimited |

**vs. Optimizely:** $299/mo. vs. VWO: $199/mo.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript strict, TailwindCSS, shadcn/ui
- **Backend:** Next.js API routes, Drizzle ORM + PostgreSQL
- **Widget:** Vanilla JS, ~4KB gzipped, zero dependencies
- **Worker:** BullMQ + Redis (email digests, stats aggregation)
- **Auth:** NextAuth.js v5 (GitHub + Google OAuth)
- **Payments:** Stripe
- **Email:** Resend

## Project Structure

```
abkit/
├── apps/
│   ├── web/          # Next.js dashboard + public API
│   └── worker/       # BullMQ background jobs
└── packages/
    ├── db/           # Drizzle ORM schema + client
    └── widget/       # Vanilla JS browser widget
```

## Development

```bash
pnpm install
pnpm dev
```

## Environment Variables

See `.env.example` for all required variables.

---

Built by [ThreeStack](https://threestack.io)
