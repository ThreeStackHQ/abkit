import Link from 'next/link'
import { Plus, FlaskConical, Users, TrendingUp } from 'lucide-react'
import ExperimentsTable from './ExperimentsTable'

export const dynamic = 'force-dynamic'

interface Variant {
  id: string
  name: string
  isControl: boolean
  visitorCount: number
  conversionCount: number
  conversionRate: number
}

interface Experiment {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'running' | 'paused' | 'completed'
  goalType: string
  trafficAllocation: number
  variants: Variant[]
  winnerVariantId: string | null
}

async function getExperiments(): Promise<Experiment[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/experiments`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function ExperimentsPage() {
  const experiments = await getExperiments()

  const activeCount = experiments.filter((e) => e.status === 'running').length
  const totalVisitors = experiments.reduce(
    (sum, e) => sum + e.variants.reduce((s, v) => s + v.visitorCount, 0),
    0
  )
  const lifts = experiments.flatMap((e) =>
    e.variants.filter((v) => !v.isControl && v.visitorCount > 0).map((v) => v.conversionRate)
  )
  const avgLift = lifts.length > 0 ? lifts.reduce((a, b) => a + b, 0) / lifts.length : 0

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Experiments</h1>
          <p className="text-gray-400 mt-1">Manage and monitor your A/B tests</p>
        </div>
        <Link
          href="/dashboard/experiments/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Experiment
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-[#7c3aed]/20 rounded-lg">
            <FlaskConical className="w-5 h-5 text-[#7c3aed]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{activeCount}</p>
            <p className="text-xs text-gray-400">Active tests</p>
          </div>
        </div>
        <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalVisitors.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Total visitors</p>
          </div>
        </div>
        <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{avgLift.toFixed(1)}%</p>
            <p className="text-xs text-gray-400">Avg lift</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl overflow-hidden">
        {experiments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FlaskConical className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No experiments yet</p>
            <p className="text-sm text-gray-500 mb-6">Create your first A/B test to get started</p>
            <Link
              href="/dashboard/experiments/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create experiment
            </Link>
          </div>
        ) : (
          <ExperimentsTable experiments={experiments} />
        )}
      </div>
    </div>
  )
}
