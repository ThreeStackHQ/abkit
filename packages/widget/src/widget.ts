/**
 * AbKit Widget — Vanilla JS A/B testing
 * 
 * Usage:
 *   <script defer src="https://cdn.abkit.threestack.io/widget.js"
 *     data-api-key="ak_live_xxxx">
 *   </script>
 * 
 * Manual conversion:
 *   window.abkit?.convert()
 */

interface Variant {
  id: string
  name: string
  isControl: boolean
  targetSelector?: string
  htmlContent?: string
  cssOverride?: string
  redirectUrl?: string
}

interface Experiment {
  id: string
  name: string
  goalType: 'click' | 'pageview' | 'form_submit' | 'custom'
  goalSelector?: string
  trafficAllocation: number
  splitRatio: number
  variants: Variant[]
}

interface Assignment {
  experimentId: string
  variantId: string
}

const COOKIE_PREFIX = '_abkit_'
const COOKIE_DAYS = 30
const API_BASE = 'https://api.abkit.threestack.io'

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${COOKIE_PREFIX}${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const key = `${COOKIE_PREFIX}${name}=`
  const found = document.cookie.split('; ').find((c) => c.startsWith(key))
  return found ? found.slice(key.length) : null
}

// ─── Visitor hash ─────────────────────────────────────────────────────────────

function getOrCreateVisitorId(): string {
  let vid = getCookie('visitor')
  if (!vid) {
    // Cryptographically random ID — privacy-safe, no PII
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      vid = crypto.randomUUID().replace(/-/g, '')
    } else {
      // Fallback for older browsers
      const arr = new Uint8Array(16)
      crypto.getRandomValues(arr)
      vid = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
    }
    setCookie('visitor', vid, 365)
  }
  return vid
}

// ─── Traffic allocation check ─────────────────────────────────────────────────

function shouldIncludeVisitor(trafficAllocation: number, visitorId: string): boolean {
  if (trafficAllocation >= 100) return true
  // Consistent hash: same visitor always in/out
  let hash = 0
  for (let i = 0; i < visitorId.length; i++) {
    hash = ((hash << 5) - hash + visitorId.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 100) < trafficAllocation
}

// ─── Variant assignment ───────────────────────────────────────────────────────

function assignVariant(experiment: Experiment, visitorId: string): Variant | null {
  // BUG-001: Guard against experiments with no variants (should never happen, but be defensive)
  if (!experiment.variants || experiment.variants.length === 0) return null

  const existing = getCookie(`exp_${experiment.id}`)
  const targetVariant = experiment.variants.find((v) => v.id === existing)
  if (targetVariant) return targetVariant

  // Assign: consistent hash determines control vs variant
  let hash = 0
  const seed = visitorId + experiment.id
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  const bucket = Math.abs(hash) % 100
  const isVariant = bucket < experiment.splitRatio

  const assigned = experiment.variants.find((v) => v.isControl === !isVariant)
    ?? experiment.variants[0]

  // BUG-001: assigned could still be undefined if neither find nor [0] returns a variant
  if (!assigned) return null

  setCookie(`exp_${experiment.id}`, assigned.id, COOKIE_DAYS)
  return assigned
}

// ─── Apply variant ────────────────────────────────────────────────────────────

function applyVariant(variant: Variant): void {
  if (variant.isControl) return // No changes for control

  if (variant.redirectUrl) {
    window.location.replace(variant.redirectUrl)
    return
  }

  if (variant.cssOverride) {
    const style = document.createElement('style')
    style.textContent = variant.cssOverride
    document.head.appendChild(style)
  }

  if (variant.targetSelector && variant.htmlContent != null) {
    const applyDom = (): void => {
      const el = document.querySelector(variant.targetSelector!)
      if (el) el.innerHTML = variant.htmlContent!
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyDom)
    } else {
      applyDom()
    }
  }
}

// ─── Track impression ─────────────────────────────────────────────────────────

async function trackImpression(
  experimentId: string,
  variantId: string,
  visitorHash: string,
  apiKey: string,
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/widget/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // SEC-002: Send API key in Authorization header, not request body
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ experimentId, variantId, visitorHash, event: 'impression' }),
      keepalive: true,
    })
  } catch {
    // Fail silently — never break the page
  }
}

// ─── Track conversion ─────────────────────────────────────────────────────────

async function trackConversion(
  experimentId: string,
  variantId: string,
  visitorHash: string,
  apiKey: string,
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/widget/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // SEC-002: Send API key in Authorization header, not request body
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ experimentId, variantId, visitorHash, event: 'conversion' }),
      keepalive: true,
    })
    // Mark converted in cookie so we don't double-count
    setCookie(`conv_${experimentId}`, '1', COOKIE_DAYS)
  } catch {
    // Fail silently
  }
}

// ─── Setup goal tracking ──────────────────────────────────────────────────────

function setupGoalTracking(
  experiment: Experiment,
  variantId: string,
  visitorHash: string,
  apiKey: string,
): void {
  // Don't track if already converted
  if (getCookie(`conv_${experiment.id}`)) return

  const convert = (): void => {
    void trackConversion(experiment.id, variantId, visitorHash, apiKey)
  }

  switch (experiment.goalType) {
    case 'click': {
      if (!experiment.goalSelector) return
      const setup = (): void => {
        const el = document.querySelector(experiment.goalSelector!)
        if (el) {
          el.addEventListener('click', convert, { once: true })
        }
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup)
      } else {
        setup()
      }
      break
    }
    case 'pageview': {
      if (!experiment.goalSelector) return
      // Goal matches if current URL matches selector (treated as URL pattern)
      if (window.location.href.includes(experiment.goalSelector)) {
        convert()
      }
      break
    }
    case 'form_submit': {
      if (!experiment.goalSelector) return
      const setup = (): void => {
        const form = document.querySelector(experiment.goalSelector!)
        if (form) {
          form.addEventListener('submit', convert, { once: true })
        }
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup)
      } else {
        setup()
      }
      break
    }
    case 'custom':
      // Manual conversion via window.abkit.convert(experimentId)
      break
  }
}

// ─── Main init ────────────────────────────────────────────────────────────────

interface AbkitPublicAPI {
  convert: (experimentId?: string) => void
  assignments: Assignment[]
}

declare global {
  interface Window {
    abkit?: AbkitPublicAPI
  }
}

async function init(): Promise<void> {
  const script = document.currentScript as HTMLScriptElement | null
    ?? document.querySelector('script[data-api-key]') as HTMLScriptElement | null

  const apiKey = script?.getAttribute('data-api-key')
  if (!apiKey) {
    console.warn('[AbKit] Missing data-api-key attribute on script tag')
    return
  }

  const visitorId = getOrCreateVisitorId()
  const assignments: Assignment[] = []

  // Expose public API immediately (before fetch, for custom conversion calls)
  window.abkit = {
    convert: (experimentId?: string) => {
      const targets = experimentId
        ? assignments.filter((a) => a.experimentId === experimentId)
        : assignments

      for (const a of targets) {
        if (!getCookie(`conv_${a.experimentId}`)) {
          void trackConversion(a.experimentId, a.variantId, visitorId, apiKey)
        }
      }
    },
    assignments,
  }

  try {
    // SEC-002: Use Authorization header — API key must not appear in URLs (logs, CDN, referrer)
    const res = await fetch(`${API_BASE}/api/widget/experiments`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!res.ok) return

    const { experiments: exps }: { experiments: Experiment[] } = await res.json() as { experiments: Experiment[] }

    for (const experiment of exps) {
      if (!shouldIncludeVisitor(experiment.trafficAllocation, visitorId)) continue

      const variant = assignVariant(experiment, visitorId)
      // BUG-001: skip if no variant could be assigned (empty variants list)
      if (!variant) continue

      assignments.push({ experimentId: experiment.id, variantId: variant.id })

      applyVariant(variant)
      void trackImpression(experiment.id, variant.id, visitorId, apiKey)
      setupGoalTracking(experiment, variant.id, visitorId, apiKey)
    }
  } catch {
    // Never break the page
  }
}

void init()
