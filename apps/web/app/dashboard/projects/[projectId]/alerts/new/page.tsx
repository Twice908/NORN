import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@norn/db'
import AlertForm from '@/components/alerts/AlertForm'

export default async function NewAlertPage({ params }: { params: { projectId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const project = await prisma.project.findFirst({ where: { id: params.projectId, userId: session.user.id }, select: { id: true, name: true } })
  if (!project) redirect('/dashboard/agents')

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400">{project.name}</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Create alert</h1>
      </div>
      <AlertForm projectId={project.id} />
    </div>
  )
}