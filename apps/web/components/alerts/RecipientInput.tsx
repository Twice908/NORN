'use client'

import { useState } from 'react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface RecipientInputProps {
  value: string[]
  onChange: (recipients: string[]) => void
}

export default function RecipientInput({ value, onChange }: RecipientInputProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add(valueToAdd: string) {
    const email = valueToAdd.trim()
    if (!email) return
    if (!EMAIL_PATTERN.test(email)) return setError('Enter a valid email address.')
    if (value.includes(email)) return setError('That recipient is already added.')
    if (value.length >= 10) return setError('You can add up to 10 recipients.')
    onChange([...value, email])
    setDraft('')
    setError(null)
  }

  function handleChange(next: string) {
    const parts = next.split(',')
    if (parts.length > 1) {
      parts.slice(0, -1).forEach(add)
      setDraft(parts.at(-1) ?? '')
    } else {
      setDraft(next)
      setError(null)
    }
  }

  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700">
        {value.map((recipient) => (
          <span key={recipient} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
            {recipient}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== recipient))} aria-label={`Remove ${recipient}`} className="text-indigo-500 hover:text-indigo-900">×</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              add(draft)
            }
            if (event.key === 'Backspace' && !draft && value.length > 0) onChange(value.slice(0, -1))
          }}
          onBlur={() => { if (draft) add(draft) }}
          placeholder={value.length === 0 ? 'you@example.com' : 'Add another email'}
          className="min-w-[12rem] flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-slate-100"
          type="email"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-400">Press Enter or comma after each address. Up to 10 recipients.</p>
    </div>
  )
}