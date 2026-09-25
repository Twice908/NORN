import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@norn/db'
import AlertForm from '@/components/alerts/AlertForm'
import type { AlertInput } from '@/app/dashboard/projects/[projectId]/alerts/actions'

export default async function EditAlertPage({ params }: { params: { projectId: string; alertId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const alert = await prisma.alert.findFirst({ where: { id: params.alertId, projectId: params.projectId, project: { userId: session.user.id } }, include: { project: { select: { name: true } } } })
  if (!alert) redirect(`/dashboard/projects/${params.projectId}/alerts`)
  const rule = alert.rule as AlertInput['rule']
  const channels = alert.channels as AlertInput['channels']
  const initial: AlertInput = { name: alert.name, enabled: alert.enabled, rule, channels }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400">{alert.project.name}</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Edit alert</h1>
      </div>
      <AlertForm projectId={params.projectId} alertId={alert.id} initial={initial} />
    </div>
  )
}