'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import type { AuthActionState } from '@/app/(auth)/actions'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Please wait...' : label}
    </button>
  )
}

export function AuthForm({
  action,
  mode,
}: {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>
  mode: 'sign-in' | 'sign-up'
}) {
  const [state, formAction] = useFormState(action, {})
  const isSignIn = mode === 'sign-in'

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">PAO</p>
          <h1 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">
            {isSignIn ? 'Sign in' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignIn ? 'Access your agent observability dashboard.' : 'Run PAO on your own instance.'}
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={isSignIn ? undefined : 8}
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <SubmitButton label={isSignIn ? 'Sign in' : 'Create account'} />
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isSignIn ? 'Need an account?' : 'Already have an account?'}{' '}
          <Link
            href={isSignIn ? '/sign-up' : '/sign-in'}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignIn ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </main>
  )
}
