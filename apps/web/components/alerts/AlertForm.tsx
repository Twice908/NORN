'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import RecipientInput from './RecipientInput'
import { createAlert, updateAlert, type AlertInput } from '@/app/dashboard/projects/[projectId]/alerts/actions'

type RuleType = AlertInput['rule']['type']
type Window = AlertInput['rule']['window']

interface AlertFormProps {
  projectId: string
  alertId?: string
  initial?: AlertInput
}

const defaults: AlertInput = {
  name: '',
  enabled: true,
  rule: { type: 'run_failed', threshold: 1, window: '5m' },
  channels: { email: { enabled: true, recipients: [] } },
}

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400'

function thresholdLabel(type: RuleType): string {
  if (type === 'error_rate') return 'Error rate threshold (%)'
  if (type === 'rate_limit') return 'Requests per window'
  if (type === 'cost_spike') return 'Cost threshold (USD)'
  return 'Failed runs threshold'
}

export default function AlertForm({ projectId, alertId, initial = defaults }: AlertFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<AlertInput>(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('Name is required.')
    if (!Number.isFinite(form.rule.threshold) || form.rule.threshold <= 0) return setError('Threshold must be greater than 0.')
    if (form.rule.type === 'error_rate' && form.rule.threshold > 100) return setError('Error rate must be 100 or less.')
    if (form.channels.email.enabled && form.channels.email.recipients.length === 0) return setError('Add at least one recipient when email is enabled.')

    startTransition(async () => {
      const result = alertId ? await updateAlert(alertId, form) : await createAlert({ ...form, projectId })
      if (result.ok) router.push(`/dashboard/projects/${projectId}/alerts`)
      else setError(result.error)
    })
  }

  const setRuleType = (type: RuleType) => setForm((current) => ({ ...current, rule: { ...current.rule, type } }))

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div>
        <label className={labelClass} htmlFor="alert-name">Name</label>
        <input id="alert-name" value={form.name} maxLength={80} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Production failures" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="alert-rule">Rule type</label>
          <select id="alert-rule" value={form.rule.type} onChange={(event) => setRuleType(event.target.value as RuleType)} className={inputClass}>
            <option value="error_rate">error_rate</option>
            <option value="rate_limit">rate_limit</option>
            <option value="run_failed">run_failed</option>
            <option value="cost_spike">cost_spike</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="alert-window">Window</label>
          <select id="alert-window" value={form.rule.window} onChange={(event) => setForm({ ...form, rule: { ...form.rule, window: event.target.value as Window } })} className={inputClass}>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="24h">24h</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="alert-threshold">{thresholdLabel(form.rule.type)}</label>
        <input id="alert-threshold" type="number" min="0.01" step="any" value={form.rule.threshold} onChange={(event) => setForm({ ...form, rule: { ...form.rule, threshold: Number(event.target.value) } })} className={inputClass} />
      </div>

      <fieldset className="space-y-3">
        <legend className={labelClass}>Notification channel</legend>
        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-200">
          <input type="checkbox" checked={form.channels.email.enabled} onChange={(event) => setForm({ ...form, channels: { email: { ...form.channels.email, enabled: event.target.checked } } })} className="h-4 w-4 accent-indigo-600" />
          Email
        </label>
        {form.channels.email.enabled && (
          <RecipientInput value={form.channels.email.recipients} onChange={(recipients) => setForm({ ...form, channels: { email: { ...form.channels.email, recipients } } })} />
        )}
      </fieldset>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{isPending ? 'Saving…' : 'Save alert'}</button>
        <button type="button" onClick={() => router.push(`/dashboard/projects/${projectId}/alerts`)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</button>
      </div>
    </form>
  )
}