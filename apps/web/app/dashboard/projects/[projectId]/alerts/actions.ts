'use server'

import { auth } from '@/auth'
import { prisma } from '@pulse/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const alertRuleSchema = z.object({
  type: z.enum(['error_rate', 'rate_limit', 'run_failed', 'cost_spike']),
  threshold: z.number().positive(),
  window: z.enum(['5m', '15m', '1h', '24h']),
})

export const alertChannelsSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    recipients: z.array(z.string().email()).max(10),
  }),
})

export const alertInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  enabled: z.boolean().default(true),
  rule: alertRuleSchema,
  channels: alertChannelsSchema,
}).superRefine((value, context) => {
  if (value.channels.email.enabled && value.channels.email.recipients.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['channels', 'email', 'recipients'], message: 'Add at least one recipient when email is enabled.' })
  }
})

export type AlertInput = z.infer<typeof alertInputSchema>
export type AlertActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function ownedProject(userId: string, projectId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } })
}

async function sessionUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

function legacyFields(input: AlertInput) {
  const legacyType = input.rule.type === 'error_rate' ? 'agent_error_rate' : input.rule.type
  return {
    type: legacyType,
    threshold: input.rule.threshold,
    channel: 'email',
    destination: input.channels.email.recipients.join(','),
    active: input.enabled,
    agentMetrics: input.rule.type === 'error_rate'
      ? { timeWindowMinutes: input.rule.window === '5m' ? 5 : input.rule.window === '15m' ? 15 : input.rule.window === '24h' ? 1440 : 60 }
      : undefined,
  }
}

export async function createAlert(input: unknown): Promise<AlertActionResult<{ id: string }>> {
  const userId = await sessionUserId()
  if (!userId) return { ok: false, error: 'You must be signed in.' }
  const parsed = alertInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid alert.' }
  const project = await ownedProject(userId, (input as { projectId?: string }).projectId ?? '')
  if (!project) return { ok: false, error: 'Project not found.' }

  try {
    const alert = await prisma.alert.create({
      data: {
        projectId: project.id,
        name: parsed.data.name,
        enabled: parsed.data.enabled,
        rule: parsed.data.rule,
        channels: parsed.data.channels,
        ...legacyFields(parsed.data),
      },
      select: { id: true },
    })
    revalidatePath(`/dashboard/projects/${project.id}/alerts`)
    return { ok: true, data: alert }
  } catch {
    return { ok: false, error: 'Unable to create alert.' }
  }
}

export async function updateAlert(id: string, input: unknown): Promise<AlertActionResult<{ id: string }>> {
  const userId = await sessionUserId()
  if (!userId) return { ok: false, error: 'You must be signed in.' }
  const parsed = alertInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid alert.' }

  try {
    const existing = await prisma.alert.findFirst({ where: { id }, include: { project: { select: { userId: true, id: true } } } })
    if (!existing || existing.project.userId !== userId) return { ok: false, error: 'Alert not found.' }
    const alert = await prisma.alert.update({
      where: { id },
      data: { name: parsed.data.name, enabled: parsed.data.enabled, rule: parsed.data.rule, channels: parsed.data.channels, ...legacyFields(parsed.data) },
      select: { id: true },
    })
    revalidatePath(`/dashboard/projects/${existing.project.id}/alerts`)
    return { ok: true, data: alert }
  } catch {
    return { ok: false, error: 'Unable to update alert.' }
  }
}

export async function deleteAlert(id: string): Promise<AlertActionResult<{ id: string }>> {
  const userId = await sessionUserId()
  if (!userId) return { ok: false, error: 'You must be signed in.' }
  try {
    const existing = await prisma.alert.findFirst({ where: { id }, include: { project: { select: { userId: true, id: true } } } })
    if (!existing || existing.project.userId !== userId) return { ok: false, error: 'Alert not found.' }
    await prisma.alert.delete({ where: { id } })
    revalidatePath(`/dashboard/projects/${existing.project.id}/alerts`)
    return { ok: true, data: { id } }
  } catch {
    return { ok: false, error: 'Unable to delete alert.' }
  }
}

export async function toggleAlert(id: string, enabled: boolean): Promise<AlertActionResult<{ id: string; enabled: boolean }>> {
  const userId = await sessionUserId()
  if (!userId) return { ok: false, error: 'You must be signed in.' }
  try {
    const existing = await prisma.alert.findFirst({ where: { id }, include: { project: { select: { userId: true, id: true } } } })
    if (!existing || existing.project.userId !== userId) return { ok: false, error: 'Alert not found.' }
    const alert = await prisma.alert.update({ where: { id }, data: { enabled, active: enabled }, select: { id: true, enabled: true } })
    revalidatePath(`/dashboard/projects/${existing.project.id}/alerts`)
    return { ok: true, data: alert }
  } catch {
    return { ok: false, error: 'Unable to update alert.' }
  }
}