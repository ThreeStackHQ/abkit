import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <DashboardShell
      userEmail={session.user?.email ?? ''}
      userName={session.user?.name ?? ''}
    >
      {children}
    </DashboardShell>
  )
}
