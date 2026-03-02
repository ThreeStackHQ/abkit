'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Crown,
  Users,
  Target,
  TrendingUp,
  Play,
  Pause,
  Square,
  Loader2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface VariantResult {
  id: string
  name: string
  isControl: boolean
  isWinner: boolean
  visitorCount: number
  conversionCount: number
  conversionRate: number
  lift: number | null
}

interface ResultsData {
  experiment: {
    id: string
    name: string
    status: 'draft' | 'running' | 'paused' | 'completed'
    goalType: string
    trafficAllocation: number
    createdAt: string
  }
  variants: VariantResult[]
  statisticalSignificance: number
  confidenceLevel: number
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
  running: { label: 'Running', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  paused: { label: 'Paused', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  completed: { label: 'Completed', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/experiments/${id}/results`)
      if (!res.ok) throw new Error('Failed to fetch results')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [id])

  const doAction = async (action: 'start' | 'pause' | 'stop') => {
    setActionLoading(action)
    try {
      await fetch(`/api/experiments/${id}/${action}`, { method: 'POST' })
      await fetchResults()
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error || 'Failed to load results'}</p>
          <Link href="/dashboard/experiments" className="mt-4 inline-flex items-center gap-2 text-sm text-[#7c3aed]">
            <ArrowLeft className="w-4 h-4" /> Back to experiments
          </Link>
        </div>
      </div>
    )
  }

  const { experiment, variants, statisticalSignificance, confidenceLevel } = data
  const status = experiment.status
  const cfg = statusConfig[status] ?? statusConfig.draft
  const isSignificant = statisticalSignificance >= 0.95

  const chartData = variants.map((v) => ({
    name: v.name,
    conversionRate: parseFloat(v.conversionRate.toFixed(2)),
    isControl: v.isControl,
  }))

  const totalVisitors = variants.reduce((s, v) => s + v.visitorCount, 0)
  const visitorsNeeded = Math.max(0, 1000 - totalVisitors)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/experiments"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{experiment.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5 capitalize">Goal: {experiment.goalType.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Status controls */}
        <div className="flex items-center gap-2">
          {(status === 'draft' || status === 'paused') && (
            <button
              onClick={() => doAction('start')}
              disabled={actionLoading === 'start'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start
            </button>
          )}
          {status === 'running' && (
            <button
              onClick={() => doAction('pause')}
              disabled={actionLoading === 'pause'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'pause' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              Pause
            </button>
          )}
          {(status === 'running' || status === 'paused') && (
            <button
              onClick={() => doAction('stop')}
              disabled={actionLoading === 'stop'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'stop' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Statistical significance badge */}
      <div className="mb-6">
        {isSignificant ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            95% Confidence — Results are statistically significant
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-pulse" />
            Not significant yet — {confidenceLevel.toFixed(0)}% confidence ({visitorsNeeded.toLocaleString()} more visitors needed)
          </div>
        )}
      </div>

      {/* Variant cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className={`bg-[#1e293b] rounded-xl p-5 border transition-all ${
              variant.isWinner
                ? 'border-[#7c3aed] shadow-[0_0_20px_rgba(124,58,237,0.25)]'
                : 'border-[#2d3748]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">{variant.name}</h3>
                {variant.isControl && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    Control
                  </span>
                )}
              </div>
              {variant.isWinner && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#7c3aed]/20 border border-[#7c3aed]/40 rounded-full">
                  <Crown className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span className="text-xs text-[#7c3aed] font-medium">Winner</span>
                </div>
              )}
            </div>

            <div className="text-center my-4">
              <p className="text-4xl font-bold text-white">
                {variant.conversionRate.toFixed(1)}
                <span className="text-xl text-gray-400">%</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Conversion Rate</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{variant.visitorCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Visitors</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/20 rounded-lg">
                  <Target className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{variant.conversionCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Conversions</p>
                </div>
              </div>
            </div>

            {!variant.isControl && variant.lift !== null && (
              <div className="mt-3 pt-3 border-t border-[#2d3748]">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <span className={`text-sm font-medium ${variant.lift >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {variant.lift >= 0 ? '+' : ''}{variant.lift.toFixed(1)}% vs control
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-5">Conversion Rate Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
              formatter={(value: number) => [`${value}%`, 'Conv. Rate']}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Bar dataKey="conversionRate" name="Conversion Rate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.isControl ? '#6b7280' : '#7c3aed'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Created</p>
            <p className="text-sm text-white">
              {new Date(experiment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Traffic Allocation</p>
            <p className="text-sm text-white">{experiment.trafficAllocation}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Goal Type</p>
            <p className="text-sm text-white capitalize">{experiment.goalType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Visitors for Significance</p>
            <p className="text-sm text-white">{visitorsNeeded > 0 ? `~${visitorsNeeded.toLocaleString()} more` : '✓ Reached'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
