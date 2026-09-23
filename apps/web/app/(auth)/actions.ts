'use server'

import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { signIn, signOut } from '@/auth'
import { prisma } from '@pulse/db'

export type AuthActionState = { error?: string }

export async function signOutAction() {
  await signOut({ redirectTo: '/sign-in' })
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email and password are required.' }

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (error) {
    if (error instanceof AuthError) return { error: 'Invalid email or password.' }
    throw error
  }

  return {}
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' }
  }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) return { error: 'An account with that email already exists.' }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, passwordHash } })

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (error) {
    if (error instanceof AuthError) {
      await prisma.user.delete({ where: { id: user.id } })
      return { error: 'Unable to sign in after creating the account.' }
    }
    throw error
  }

  return {}
}
