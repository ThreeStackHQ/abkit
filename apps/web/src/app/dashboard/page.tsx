import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0f0a1e] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, {session.user?.name ?? session.user?.email}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1035] border border-[#2d1f5e] rounded-xl p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Experiments</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
          <div className="bg-[#1a1035] border border-[#2d1f5e] rounded-xl p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Running Tests</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
          <div className="bg-[#1a1035] border border-[#2d1f5e] rounded-xl p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Visitors</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
