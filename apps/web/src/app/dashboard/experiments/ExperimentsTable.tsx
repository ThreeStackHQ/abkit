'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, Pause, Square, Trash2, BarChart2 } from 'lucide-react'

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

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
  running: { label: 'Running', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  paused: { label: 'Paused', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  completed: { label: 'Completed', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
}

export default function ExperimentsTable({ experiments }: { experiments: Experiment[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const doAction = async (id: string, action: 'start' | 'pause' | 'stop' | 'delete') => {
    setLoading(`${id}-${action}`)
    try {
      if (action === 'delete') {
        await fetch(`/api/experiments/${id}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/experiments/${id}/${action}`, { method: 'POST' })
      }
      router.refresh()
    } catch {
      // ignore
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2d3748]">
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Variants</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Visitors</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Conv. Rate</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2d3748]">
          {experiments.map((exp) => {
            const cfg = statusConfig[exp.status] ?? statusConfig.draft
            const visitors = exp.variants.reduce((s, v) => s + v.visitorCount, 0)
            const control = exp.variants.find((v) => v.isControl)
            const best = exp.variants.reduce((a, b) => (a.conversionRate > b.conversionRate ? a : b), exp.variants[0])
            const controlRate = control?.conversionRate ?? 0
            const bestRate = best?.conversionRate ?? 0

            return (
              <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div>
                    <Link
                      href={`/dashboard/experiments/${exp.id}/results`}
                      className="text-sm font-medium text-white hover:text-[#7c3aed] transition-colors"
                    >
                      {exp.name}
                    </Link>
                    {exp.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{exp.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{exp.variants.length}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{visitors.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Control: </span>
                    <span className="text-white">{controlRate.toFixed(1)}%</span>
                    {best && !best.isControl && (
                      <>
                        <span className="text-gray-500 mx-1">→ Best: </span>
                        <span className="text-green-400">{bestRate.toFixed(1)}%</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/experiments/${exp.id}/results`}
                      className="p-1.5 text-gray-400 hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-lg transition-colors"
                      title="View Results"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Link>

                    {(exp.status === 'draft' || exp.status === 'paused') && (
                      <button
                        onClick={() => doAction(exp.id, 'start')}
                        disabled={loading === `${exp.id}-start`}
                        className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Start"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    {exp.status === 'running' && (
                      <button
                        onClick={() => doAction(exp.id, 'pause')}
                        disabled={loading === `${exp.id}-pause`}
                        className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}

                    {(exp.status === 'running' || exp.status === 'paused') && (
                      <button
                        onClick={() => doAction(exp.id, 'stop')}
                        disabled={loading === `${exp.id}-stop`}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Stop"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm('Delete this experiment?')) doAction(exp.id, 'delete')
                      }}
                      disabled={loading === `${exp.id}-delete`}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
