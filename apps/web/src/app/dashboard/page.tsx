import Link from 'next/link'
import { FlaskConical, Users, TrendingUp, ArrowRight } from 'lucide-react'

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

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
  running: { label: 'Running', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  paused: { label: 'Paused', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  completed: { label: 'Completed', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
}

export default async function DashboardPage() {
  const experiments = await getExperiments()

  const activeCount = experiments.filter((e) => e.status === 'running').length
  const totalVisitors = experiments.reduce(
    (sum, e) => sum + e.variants.reduce((s, v) => s + v.visitorCount, 0),
    0
  )
  const nonControlRates = experiments.flatMap((e) =>
    e.variants.filter((v) => !v.isControl && v.visitorCount > 0).map((v) => v.conversionRate)
  )
  const avgLift =
    nonControlRates.length > 0
      ? nonControlRates.reduce((a, b) => a + b, 0) / nonControlRates.length
      : 0

  const recent = experiments.slice(0, 5)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 mt-1">Your A/B testing at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#7c3aed]/20 rounded-lg">
              <FlaskConical className="w-5 h-5 text-[#7c3aed]" />
            </div>
            <span className="text-sm text-gray-400 font-medium">Active Experiments</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">{experiments.length} total</p>
        </div>

        <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400 font-medium">Total Visitors This Month</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalVisitors.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">across all experiments</p>
        </div>

        <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-gray-400 font-medium">Avg Conversion Lift</span>
          </div>
          <p className="text-3xl font-bold text-white">{avgLift.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">across variants</p>
        </div>
      </div>

      {/* Recent experiments */}
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748]">
          <h2 className="text-base font-semibold text-white">Recent Experiments</h2>
          <Link
            href="/dashboard/experiments"
            className="flex items-center gap-1 text-sm text-[#7c3aed] hover:text-purple-400 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FlaskConical className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No experiments yet</p>
            <Link
              href="/dashboard/experiments/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
            >
              Create your first experiment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d3748]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Variants</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Visitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3748]">
                {recent.map((exp) => {
                  const cfg = statusConfig[exp.status] ?? statusConfig.draft
                  const visitors = exp.variants.reduce((s, v) => s + v.visitorCount, 0)
                  return (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/experiments/${exp.id}/results`}
                          className="text-sm font-medium text-white hover:text-[#7c3aed] transition-colors"
                        >
                          {exp.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{exp.variants.length}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{visitors.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
