'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { deleteAlert, toggleAlert } from '@/app/dashboard/projects/[projectId]/alerts/actions'

interface AlertRow {
  id: string
  name: string
  enabled: boolean
  rule: { type: string; threshold: number; window: string }
  channels: { email?: { enabled?: boolean; recipients?: string[] } }
  lastTriggered: string | null
}

function relativeTime(value: string | null): string {
  if (!value) return 'Never'
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function AlertList({ projectId, alerts }: { projectId: string; alerts: AlertRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) window.alert(result.error ?? 'Unable to update alert.')
      else router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <table className="min-w-[760px] w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Rule</th><th className="px-4 py-3">Threshold</th><th className="px-4 py-3">Window</th><th className="px-4 py-3">Email recipients</th><th className="px-4 py-3">Enabled</th><th className="px-4 py-3">Last triggered</th><th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {alerts.map((alert) => {
            const recipients = alert.channels.email?.recipients ?? []
            return (
              <tr key={alert.id} className="text-gray-700 dark:text-slate-200">
                <td className="px-4 py-4 font-medium">{alert.name}</td>
                <td className="px-4 py-4"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">{alert.rule.type}</span></td>
                <td className="px-4 py-4">{alert.rule.threshold}</td>
                <td className="px-4 py-4">{alert.rule.window}</td>
                <td className="max-w-[220px] px-4 py-4 text-xs text-gray-500 dark:text-slate-400">{recipients.length ? recipients.join(', ') : 'Email off'}</td>
                <td className="px-4 py-4"><button type="button" disabled={isPending} onClick={() => run(() => toggleAlert(alert.id, !alert.enabled))} className={`rounded-full px-2.5 py-1 text-xs font-medium ${alert.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>{alert.enabled ? 'On' : 'Off'}</button></td>
                <td className="px-4 py-4 text-xs text-gray-500 dark:text-slate-400">{relativeTime(alert.lastTriggered)}</td>
                <td className="px-4 py-4"><div className="flex items-center gap-3 whitespace-nowrap"><Link href={`/dashboard/projects/${projectId}/alerts/${alert.id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">Edit</Link><button type="button" disabled={isPending} onClick={() => { if (window.confirm('Delete this alert?')) run(() => deleteAlert(alert.id)) }} className="text-red-600 hover:underline disabled:opacity-50">Delete</button></div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}