import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@pulse/db'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/sign-in')

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        {children}
      </main>
    </div>
  )
}
