'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MousePointer2,
  Eye,
  FileText,
  Zap,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
} from 'lucide-react'

interface Variant {
  name: string
  type: 'dom_replacement' | 'css_override' | 'url_redirect'
  selector: string
  value: string
  isControl: boolean
}

interface FormData {
  name: string
  description: string
  goalType: 'click' | 'pageview' | 'form_submit' | 'custom'
  goalSelector: string
  trafficAllocation: number
  variants: Variant[]
}

const GOAL_TYPES = [
  { id: 'click', label: 'Click', icon: MousePointer2, desc: 'Track clicks on an element' },
  { id: 'pageview', label: 'Page View', icon: Eye, desc: 'Track page visits' },
  { id: 'form_submit', label: 'Form Submit', icon: FileText, desc: 'Track form submissions' },
  { id: 'custom', label: 'Custom', icon: Zap, desc: 'Custom event tracking' },
] as const

const VARIANT_TYPES = [
  { id: 'dom_replacement', label: 'DOM Replacement' },
  { id: 'css_override', label: 'CSS Override' },
  { id: 'url_redirect', label: 'URL Redirect' },
] as const

function StepIndicator({ step }: { step: number }) {
  const steps = ['Basic Info', 'Variants', 'Settings']
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const isActive = step === n
        const isDone = step > n
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isDone
                    ? 'bg-[#7c3aed] text-white'
                    : isActive
                    ? 'bg-[#7c3aed]/20 text-[#7c3aed] border-2 border-[#7c3aed]'
                    : 'bg-[#2d3748] text-gray-500 border-2 border-[#2d3748]'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'text-[#7c3aed]' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-16 mx-2 mb-5 transition-colors ${
                  step > n ? 'bg-[#7c3aed]' : 'bg-[#2d3748]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function NewExperimentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    goalType: 'click',
    goalSelector: '',
    trafficAllocation: 100,
    variants: [
      { name: 'Control', type: 'dom_replacement', selector: '', value: '', isControl: true },
    ],
  })

  const updateForm = (updates: Partial<FormData>) => setForm((f) => ({ ...f, ...updates }))

  const addVariant = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F']
    const nonControl = form.variants.filter((v) => !v.isControl).length
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        {
          name: `Variant ${labels[nonControl] ?? String(nonControl + 1)}`,
          type: 'dom_replacement',
          selector: '',
          value: '',
          isControl: false,
        },
      ],
    }))
  }

  const updateVariant = (index: number, updates: Partial<Variant>) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    }))
  }

  const removeVariant = (index: number) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          goalType: form.goalType,
          goalSelector: form.goalSelector,
          trafficAllocation: form.trafficAllocation,
          variants: form.variants,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create experiment')
      }
      router.push('/dashboard/experiments')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const valuePlaceholder = (type: Variant['type']) => {
    if (type === 'dom_replacement') return '<button class="new-cta">Click here</button>'
    if (type === 'css_override') return '.hero-button { background: #7c3aed; padding: 16px 32px; }'
    return 'https://example.com/variant-a'
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/experiments"
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Experiment</h1>
          <p className="text-gray-400 text-sm mt-0.5">Set up your A/B test</p>
        </div>
      </div>

      <StepIndicator step={step} />

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Experiment Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="e.g. Hero CTA Button Color Test"
                  className="w-full bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={3}
                  placeholder="What are you testing and why?"
                  className="w-full bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#7c3aed] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Goal Type</h2>
            <div className="grid grid-cols-2 gap-3">
              {GOAL_TYPES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => updateForm({ goalType: id })}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    form.goalType === id
                      ? 'border-[#7c3aed] bg-[#7c3aed]/10'
                      : 'border-[#2d3748] hover:border-[#4d3748]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      form.goalType === id ? 'text-[#7c3aed]' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        form.goalType === id ? 'text-[#7c3aed]' : 'text-white'
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {(form.goalType === 'click' || form.goalType === 'form_submit') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Goal Selector (CSS selector)
                </label>
                <input
                  type="text"
                  value={form.goalSelector}
                  onChange={(e) => updateForm({ goalSelector: e.target.value })}
                  placeholder="#submit-btn or .cta-button"
                  className="w-full bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!form.name.trim()) {
                  setError('Experiment name is required')
                  return
                }
                setError('')
                setStep(2)
              }}
              className="flex items-center gap-2 px-5 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Variants */}
      {step === 2 && (
        <div className="space-y-4">
          {form.variants.map((variant, i) => (
            <div key={i} className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{variant.name}</h3>
                  {variant.isControl && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      Control
                    </span>
                  )}
                </div>
                {!variant.isControl && (
                  <button
                    onClick={() => removeVariant(i)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {!variant.isControl && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(i, { name: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                  <select
                    value={variant.type}
                    onChange={(e) => updateVariant(i, { type: e.target.value as Variant['type'] })}
                    className="w-full bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c3aed] transition-colors"
                  >
                    {VARIANT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {variant.type !== 'url_redirect' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Selector (CSS selector)
                    </label>
                    <input
                      type="text"
                      value={variant.selector}
                      onChange={(e) => updateVariant(i, { selector: e.target.value })}
                      placeholder="#hero-cta or .main-button"
                      className="w-full bg-[#0f172a] border border-[#2d3748] rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {variant.type === 'url_redirect'
                      ? 'Redirect URL'
                      : variant.type === 'css_override'
                      ? 'CSS Code'
                      : 'HTML Code'}
                  </label>
                  <div className="relative">
                    <textarea
                      value={variant.value}
                      onChange={(e) => updateVariant(i, { value: e.target.value })}
                      rows={variant.type === 'url_redirect' ? 2 : 5}
                      placeholder={valuePlaceholder(variant.type)}
                      className="w-full bg-[#0a0f1e] border border-[#2d3748] rounded-lg px-3 py-2 text-green-400 text-sm font-mono focus:outline-none focus:border-[#7c3aed] transition-colors resize-none leading-relaxed"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addVariant}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#2d3748] hover:border-[#7c3aed] text-gray-400 hover:text-[#7c3aed] rounded-xl text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Variant
          </button>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => { setError(''); setStep(3) }}
              className="flex items-center gap-2 px-5 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-5">Traffic Allocation</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Percentage of visitors included</span>
                <span className="text-white font-bold">{form.trafficAllocation}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={form.trafficAllocation}
                onChange={(e) => updateForm({ trafficAllocation: parseInt(e.target.value) })}
                className="w-full accent-[#7c3aed]"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Review */}
          <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Review</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Name</span>
                <span className="text-white font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Goal Type</span>
                <span className="text-white capitalize">{form.goalType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Variants</span>
                <span className="text-white">{form.variants.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Traffic Allocation</span>
                <span className="text-white">{form.trafficAllocation}%</span>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2d3748]">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Variants</p>
                {form.variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1">
                    <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                    <span className="text-white">{v.name}</span>
                    {v.isControl && <span className="text-xs text-gray-500">(Control)</span>}
                    <span className="text-gray-500 ml-auto text-xs capitalize">
                      {v.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Experiment'}
              {!submitting && <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {step === 1 && error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
