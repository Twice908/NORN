import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@pulse/db'
import AlertList from '@/components/alerts/AlertList'

export default async function ProjectAlertsPage({ params }: { params: { projectId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const project = await prisma.project.findFirst({ where: { id: params.projectId, userId: session.user.id }, select: { id: true, name: true } })
  if (!project) redirect('/dashboard/agents')

  const alerts = await prisma.alert.findMany({
    where: { projectId: project.id },
    include: { events: { orderBy: { triggeredAt: 'desc' }, take: 1, select: { triggeredAt: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const rows = alerts.map((alert) => ({
    id: alert.id,
    name: alert.name,
    enabled: alert.enabled,
    rule: alert.rule as { type: string; threshold: number; window: string },
    channels: alert.channels as { email?: { enabled?: boolean; recipients?: string[] } },
    lastTriggered: alert.events[0]?.triggeredAt.toISOString() ?? null,
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm text-gray-500 dark:text-slate-400">{project.name}</p><h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Alerts</h1><p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Configure email notifications for this project.</p></div>
        <div className="flex items-center gap-3"><a href="http://localhost:8025" target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">View captured emails (Mailpit)</a><Link href={`/dashboard/projects/${project.id}/alerts/new`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create alert</Link></div>
      </div>
      {rows.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800"><p className="text-sm text-gray-600 dark:text-slate-300">No alerts yet. Create one to start receiving notifications.</p></div> : <AlertList projectId={project.id} alerts={rows} />}
    </div>
  )
}