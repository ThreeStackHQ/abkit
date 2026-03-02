'use client'

import Link from 'next/link'
import { FlaskConical, Check, ArrowRight, ChevronRight } from 'lucide-react'

const features = [
  {
    icon: '🎯',
    title: 'Visual Targeting',
    desc: 'Point-and-click element selection. No code needed.',
  },
  {
    icon: '⚡',
    title: '50/50 Split',
    desc: 'Automatic traffic distribution across variants.',
  },
  {
    icon: '📊',
    title: 'Statistical Significance',
    desc: 'Know when your results are real, not random.',
  },
  {
    icon: '🎯',
    title: 'Goal Types',
    desc: 'Track clicks, page views, form submits, and custom events.',
  },
  {
    icon: '💳',
    title: 'Stripe Conversion Tracking',
    desc: 'See the revenue impact of every experiment.',
  },
  {
    icon: '📧',
    title: 'Weekly Email Digest',
    desc: 'Get insights delivered to your inbox every week.',
  },
]

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    popular: false,
    features: ['1 experiment', '10K visitors/mo', 'Basic analytics', 'Community support'],
    cta: 'Get started free',
    href: '/login',
  },
  {
    name: 'Starter',
    price: '$9',
    period: '/mo',
    popular: true,
    features: ['5 experiments', '100K visitors/mo', 'All goal types', 'Email digest', 'Priority support'],
    cta: 'Start 14-day trial',
    href: '/login',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    popular: false,
    features: ['Unlimited experiments', 'Unlimited visitors', 'Stripe tracking', 'API access', 'Custom integrations'],
    cta: 'Start 14-day trial',
    href: '/login',
  },
]

const competitors = [
  { tool: 'AbKit', price: '$9/mo', experiments: 'Unlimited*', visitors: '100K', highlight: true },
  { tool: 'Optimizely', price: '$299/mo', experiments: 'Unlimited', visitors: 'Limited', highlight: false },
  { tool: 'VWO', price: '$199/mo', experiments: 'Limited', visitors: '10K', highlight: false },
  { tool: 'Adobe Target', price: 'Enterprise', experiments: 'Limited', visitors: 'Limited', highlight: false },
]

const testimonials = [
  {
    quote: 'Finally ditched Google Optimize for AbKit. Setup took literally 4 minutes.',
    author: '@indie_dev',
    role: 'SaaS founder',
  },
  {
    quote: "The stats dashboard is incredible. It paid for itself in the first week.",
    author: '@saas_founder',
    role: 'Bootstrapped CEO',
  },
  {
    quote: "Optimizely wanted $299/mo. AbKit is $9. It's a complete no-brainer.",
    author: '@bootstrapped_',
    role: 'Indie hacker',
  },
]

const steps = [
  {
    n: '1',
    title: 'Paste the script tag',
    desc: 'Add one line of code to your <head>. That\'s it.',
  },
  {
    n: '2',
    title: 'Create an experiment',
    desc: 'Use our visual builder to set up your variants.',
  },
  {
    n: '3',
    title: 'See conversions roll in',
    desc: 'Watch real-time results with statistical confidence.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-[#7c3aed]" />
            <span className="text-lg font-bold">AbKit</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Purple glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7c3aed]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-full text-[#7c3aed] text-sm mb-6">
            <FlaskConical className="w-4 h-4" />
            5-minute setup · No credit card required
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-[#7c3aed] bg-clip-text text-transparent">
              A/B test anything
            </span>
            <br />
            <span className="text-white">in 5 minutes</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Google Optimize is gone. Optimizely is $299/mo. AbKit gives indie hackers
            dead-simple split testing at <span className="text-white font-semibold">$9/mo</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 bg-[#7c3aed] text-white rounded-xl text-base font-semibold hover:bg-purple-600 transition-colors"
            >
              Start Testing Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl text-base font-medium hover:bg-white/5 transition-colors"
            >
              See It Live <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Code snippet */}
          <div className="inline-block bg-[#1e293b] border border-[#2d3748] rounded-xl p-4 text-left max-w-lg w-full">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-gray-500">index.html</span>
            </div>
            <pre className="text-sm text-green-400 font-mono whitespace-pre overflow-x-auto">
{`<script defer
  src="https://cdn.abkit.threestack.io/widget.js"
  data-api-key="ak_live_xxxx">
</script>`}
            </pre>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-gray-400">Up and running in under 5 minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed] text-xl font-bold mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features-grid" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#0a0f1e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Everything you need</h2>
            <p className="text-gray-400">Powerful features without the enterprise price tag</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-5 hover:border-[#7c3aed]/30 transition-colors"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Simple pricing</h2>
            <p className="text-gray-400">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border ${
                  plan.popular
                    ? 'bg-[#1e1b4b] border-[#7c3aed] shadow-[0_0_30px_rgba(124,58,237,0.2)]'
                    : 'bg-[#1e293b] border-[#2d3748]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#7c3aed] text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-gray-400 mb-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-[#7c3aed] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-[#7c3aed] text-white hover:bg-purple-600'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#0a0f1e]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">How we compare</h2>
            <p className="text-gray-400">Spoiler: you&apos;ll save $290/mo switching to AbKit</p>
          </div>
          <div className="bg-[#1e293b] border border-[#2d3748] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d3748]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tool</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Experiments</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Visitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3748]">
                {competitors.map((row) => (
                  <tr
                    key={row.tool}
                    className={row.highlight ? 'bg-[#7c3aed]/10' : ''}
                  >
                    <td className={`px-5 py-3.5 text-sm font-semibold ${row.highlight ? 'text-[#7c3aed]' : 'text-white'}`}>
                      {row.highlight && <FlaskConical className="w-4 h-4 inline-block mr-1.5" />}
                      {row.tool}
                    </td>
                    <td className={`px-5 py-3.5 text-sm ${row.highlight ? 'text-[#7c3aed] font-bold' : 'text-gray-300'}`}>{row.price}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-300">{row.experiments}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-300">{row.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Loved by indie hackers</h2>
            <p className="text-gray-400">Join hundreds of founders who switched to AbKit</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-5">
                <p className="text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.author}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#0a0f1e]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <FlaskConical className="w-8 h-8 text-[#7c3aed]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Start A/B testing{' '}
            <span className="bg-gradient-to-r from-purple-400 to-[#7c3aed] bg-clip-text text-transparent">
              today
            </span>
          </h2>
          <p className="text-gray-400 mb-8">Free plan available. No credit card required. 5-minute setup.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#7c3aed] text-white rounded-xl text-base font-semibold hover:bg-purple-600 transition-colors"
          >
            Get started for free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#7c3aed]" />
            <span className="text-sm font-semibold text-white">AbKit</span>
            <span className="text-gray-500 text-sm">© 2025</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Terms</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
