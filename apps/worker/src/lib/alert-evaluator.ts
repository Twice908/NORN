import pino from 'pino'
import { prisma, Prisma } from '@norn/db'
import { redis } from './redis'
import { dispatch } from './notifications'

const logger = pino({ name: 'alert-evaluator' })

const DEBOUNCE_TTL: Record<string, number> = {
  agent_error_rate: 600,
  error_rate: 600,
  run_failed: 600,
  cost_spike: 600,
  agent_token_threshold: 3600,
  agent_execution_time: 3600,
}

type AlertRule = { type?: string; threshold?: number; window?: string }

function getRule(alert: { rule?: Prisma.JsonValue; type?: string; threshold: number }): AlertRule {
  const rule = alert.rule && typeof alert.rule === 'object' && !Array.isArray(alert.rule)
    ? alert.rule as AlertRule
    : {}
  return { type: rule.type ?? alert.type, threshold: rule.threshold ?? alert.threshold, window: rule.window }
}

function windowMinutes(window: string | undefined): number {
  switch (window) {
    case '5m': return 5
    case '15m': return 15
    case '24h': return 1440
    default: return 60
  }
}

async function evaluateSingleAlert(
  alert: { id: string; projectId: string; type: string; threshold: number; channel: string; destination: string; url: string | null; route: string | null; agentMetrics: Prisma.JsonValue | null; rule: Prisma.JsonValue },
  projectName: string,
): Promise<void> {
  try {
    const rule = getRule(alert)
    if (rule.type === 'error_rate' || rule.type === 'agent_error_rate') {
      await evaluateAgentErrorRate(alert, projectName)
    }
  } catch (err) {
    logger.error({ alertId: alert.id, err }, 'Error evaluating alert')
  }
}

// ── Agent alert evaluation ────────────────────────────────────────────────────

/**
 * Entry point for the periodic agent_error_rate check (called every 5 min).
 */
export async function evaluateAgentAlerts(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return

  const alerts = await prisma.alert.findMany({
    where: { projectId, enabled: true },
  })

  await Promise.all(
    alerts.map((alert) => evaluateSingleAlert(alert, project.name)),
  )
}

/**
 * Entry point called from agent-span processor after a run completes.
 * Evaluates token_threshold and execution_time alerts immediately.
 */
export async function evaluateAgentRunAlerts(
  projectId: string,
  runId: string,
  run: { totalTokens: number | null; startedAt: Date; endedAt: Date | null; status?: string },
): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return

  const alerts = await prisma.alert.findMany({
    where: { projectId, enabled: true },
  })

  await Promise.all(
    alerts.map((alert) => {
      const rule = getRule(alert)
      if (rule.type === 'agent_token_threshold') {
        return evaluateAgentTokenThreshold(alert, runId, run, project.name)
      }
      if (rule.type === 'agent_execution_time') {
        return evaluateAgentExecutionTime(alert, runId, run, project.name)
      }
      if (rule.type === 'run_failed') {
        return evaluateRunFailed(alert, runId, run, project.name)
      }
      return Promise.resolve()
    }),
  )
}

async function evaluateAgentErrorRate(
  alert: { id: string; projectId: string; type: string; threshold: number; channel: string; destination: string; agentMetrics: Prisma.JsonValue | null; rule?: Prisma.JsonValue },
  projectName: string,
): Promise<void> {
  const rule = getRule(alert)
  const metrics = alert.agentMetrics as { timeWindowMinutes?: number } | null
  const minutes = rule.window ? windowMinutes(rule.window) : metrics?.timeWindowMinutes ?? 60
  const since = new Date(Date.now() - minutes * 60 * 1000)

  const rows = await prisma.$queryRaw<Array<{ total: bigint; failed: bigint }>>`
    SELECT
      COUNT(*)::bigint                                                              AS total,
      COUNT(*) FILTER (WHERE status IN ('error', 'failed', 'timeout', 'interrupted'))::bigint AS failed
    FROM "AgentRun"
    WHERE "projectId" = ${alert.projectId}
      AND "startedAt" >= ${since}
      AND status <> 'running'`

  const row = rows[0]
  if (!row || Number(row.total) === 0) return

  const errorRate = (Number(row.failed) / Number(row.total)) * 100
  if (errorRate <= alert.threshold) return

  await fireAlert({
    alertId: alert.id,
    projectId: alert.projectId,
    projectName,
    alertType: rule.type ?? 'error_rate',
    channel: alert.channel as 'email' | 'slack',
    destination: alert.destination,
    triggeredValue: Math.round(errorRate * 100) / 100,
    threshold: alert.threshold,
    message: `Agent error rate is ${errorRate.toFixed(1)}% over the last ${minutes} minutes (threshold: ${alert.threshold}%).`,
  })
}

async function evaluateAgentTokenThreshold(
  alert: { id: string; projectId: string; threshold: number; channel: string; destination: string },
  runId: string,
  run: { totalTokens: number | null },
  projectName: string,
): Promise<void> {
  const tokens = run.totalTokens ?? 0
  if (tokens <= alert.threshold) return

  await fireAlert({
    alertId: alert.id,
    debounceId: `${alert.id}:${runId}`,
    projectId: alert.projectId,
    projectName,
    alertType: 'agent_token_threshold',
    channel: alert.channel as 'email' | 'slack',
    destination: alert.destination,
    triggeredValue: tokens,
    threshold: alert.threshold,
    message: `Agent run used ${tokens.toLocaleString()} tokens, exceeding the threshold of ${alert.threshold.toLocaleString()} tokens. Run ID: ${runId}`,
    agentRunId: runId,
  })
}

async function evaluateAgentExecutionTime(
  alert: { id: string; projectId: string; threshold: number; channel: string; destination: string },
  runId: string,
  run: { startedAt: Date; endedAt: Date | null },
  projectName: string,
): Promise<void> {
  if (!run.endedAt) return
  const durationMs = run.endedAt.getTime() - run.startedAt.getTime()
  if (durationMs <= alert.threshold) return

  await fireAlert({
    alertId: alert.id,
    debounceId: `${alert.id}:${runId}`,
    projectId: alert.projectId,
    projectName,
    alertType: 'agent_execution_time',
    channel: alert.channel as 'email' | 'slack',
    destination: alert.destination,
    triggeredValue: durationMs,
    threshold: alert.threshold,
    message: `Agent run took ${durationMs.toLocaleString()}ms to complete, exceeding the limit of ${alert.threshold.toLocaleString()}ms. Run ID: ${runId}`,
    agentRunId: runId,
  })
}

async function evaluateRunFailed(
  alert: { id: string; projectId: string; threshold: number; channel: string; destination: string; rule?: Prisma.JsonValue },
  runId: string,
  run: { status?: string },
  projectName: string,
): Promise<void> {
  if (!['error', 'failed', 'timeout', 'interrupted'].includes(run.status ?? '')) return
  const rule = getRule(alert)
  if ((rule.threshold ?? 1) > 1) return

  await fireAlert({
    alertId: alert.id,
    projectId: alert.projectId,
    projectName,
    alertType: 'run_failed',
    channel: alert.channel as 'email' | 'slack',
    destination: alert.destination,
    triggeredValue: 1,
    threshold: rule.threshold ?? 1,
    message: `Agent run ${runId} failed with status ${run.status}.`,
    agentRunId: runId,
  })
}

async function fireAlert(params: {
  alertId: string      // real Alert.id — used for DB FK write in dispatch()
  debounceId?: string  // optional override for the Redis debounce key (use when alertId is composite)
  projectId: string
  projectName: string
  alertType: string
  channel: 'email' | 'slack'
  destination: string
  triggeredValue: number
  threshold: number
  message: string
  agentRunId?: string
}): Promise<void> {
  const debounceKey = `alert:debounce:${params.debounceId ?? params.alertId}`
  const ttl = DEBOUNCE_TTL[params.alertType] ?? 600
  const acquired = await redis.set(debounceKey, '1', 'EX', ttl, 'NX')
  if (!acquired) {
    logger.debug({ alertId: params.alertId }, 'Alert debounced — skipping')
    return
  }
  await dispatch(params)
  logger.info({ alertId: params.alertId, type: params.alertType }, 'Alert fired')
}
