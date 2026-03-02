export const dynamic = 'force-dynamic'

export default function BillingPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 mt-1">Manage your subscription and billing details</p>
      </div>
      <div className="bg-[#1e293b] border border-[#2d3748] rounded-xl p-6 text-center">
        <p className="text-gray-400">Billing management — see Settings for plan details</p>
      </div>
    </div>
  )
}
