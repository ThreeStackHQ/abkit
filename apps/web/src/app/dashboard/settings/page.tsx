'use client'

import { useState, useEffect } from 'react'
import {
  Eye,
  EyeOff,
  Clipboard,
  ClipboardCheck,
  RefreshCw,
  Loader2,
  Check,
  ExternalLink,
} from 'lucide-react'

interface Workspace {
  name: string
  apiKey: string
}

interface Subscription {
  tier: 'free' | 'starter' | 'pro'
  status: string
  experimentsUsed?: number
  experimentLimit?: number
}

const TIER_LIMITS: Record<string, number> = {
  free: 1,
  starter: 5,
  pro: Infinity,
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  starter: 'bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/30',
  pro: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
}

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const [workspaceName, setWorkspaceName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/workspace').then((r) => r.json()),
      fetch('/api/subscription').then((r) => r.json()),
    ])
      .then(([ws, sub]) => {
        setWorkspace(ws)
        setWorkspaceName(ws.name || '')
        setSubscription(sub)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const saveName = async () => {
    if (!workspaceName.trim()) return
    setSavingName(true)
    try {
      await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      })
      setWorkspace((w) => (w ? { ...w, name: workspaceName } : null))
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setSavingName(false)
    }
  }

  const copyApiKey = () => {
    if (workspace?.apiKey) {
      navigator.clipboard.writeText(workspace.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyScript = () => {
    const script = `<script defer src="https://cdn.abkit.threestack.io/widget.js"\n  data-api-key="${workspace?.apiKey ?? 'YOUR_API_KEY'}"></script>`
    navigator.clipboard.writeText(script)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  const upgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      // ignore
    } finally {
      setUpgrading(false)
    }
  }

  const maskedKey = workspace?.apiKey
    ? workspace.apiKey.slice(0, 8) + '••••••••••••••••••••••••'
    : ''

  const tier = subscription?.tier ?? 'free'
  const tierLimit = TIER_LIMITS[tier] ?? 1
  const experimentsUsed = subscription?.experimentsUsed ?? 0
  const usagePercent = tierLimit === Infinity ? 0 : Math.min(100, (experimentsUsed / tierLimit) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your workspace and integration</p>
      </div>

      {/* Workspace */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Workspace</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Workspace Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="flex-1 bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c3aed] transition-colors"
              />
              <button
                onClick={saveName}
                disabled={savingName}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-60 transition-colors"
              >
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : nameSaved ? <Check className="w-4 h-4" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">API Key</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-sm font-mono text-gray-300 select-all">
            {showApiKey ? workspace?.apiKey : maskedKey}
          </div>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title={showApiKey ? 'Hide' : 'Show'}
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={copyApiKey}
            className="p-2 text-gray-400 hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-lg transition-colors"
            title="Copy"
          >
            {copied ? <ClipboardCheck className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4" />}
          </button>
          <button
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
            title="Regenerate (contact support)"
            onClick={() => alert('Contact support to regenerate your API key.')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Keep this secret. Use it in your install script below.</p>
      </div>

      {/* Install script */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Install Script</h2>
          <button
            onClick={copyScript}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-lg border border-[#2d3748] transition-colors"
          >
            {copiedScript ? <ClipboardCheck className="w-3.5 h-3.5 text-green-400" /> : <Clipboard className="w-3.5 h-3.5" />}
            {copiedScript ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="bg-[#0a0f1e] border border-[#2d3748] rounded-lg p-4">
          <pre className="text-sm text-green-400 font-mono whitespace-pre overflow-x-auto">
{`<script defer
  src="https://cdn.abkit.threestack.io/widget.js"
  data-api-key="${workspace?.apiKey ?? 'YOUR_API_KEY'}">
</script>`}
          </pre>
        </div>
        <p className="text-xs text-gray-500 mt-2">Add this snippet to your <code className="text-gray-400">&lt;head&gt;</code> tag.</p>
      </div>

      {/* Billing */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Billing</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Current Plan</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_COLORS[tier]}`}>
              {tier}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-400">Experiments</span>
              <span className="text-white">
                {experimentsUsed} / {tierLimit === Infinity ? '∞' : tierLimit}
              </span>
            </div>
            {tierLimit !== Infinity && (
              <div className="h-1.5 bg-[#0f172a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7c3aed] rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {tier !== 'pro' && (
              <button
                onClick={upgrade}
                disabled={upgrading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-60 transition-colors"
              >
                {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Upgrade to Pro
              </button>
            )}
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-[#2d3748] text-gray-300 rounded-lg text-sm hover:bg-white/5 transition-colors">
              Manage billing <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h2 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-400 mb-4">
          Permanently delete your workspace, all experiments, and data. This action is irreversible.
        </p>
        <button
          disabled
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm opacity-60 cursor-not-allowed"
        >
          Contact support to delete workspace
        </button>
      </div>
    </div>
  )
}
