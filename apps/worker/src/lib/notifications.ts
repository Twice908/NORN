import pino from 'pino'
import { prisma } from '@norn/db'
import { sendAlertEmail } from './email'

const logger = pino({ name: 'notifications' })

export interface NotificationPayload {
  alertId: string
  projectId: string
  projectName: string
  alertType: string
  channel: 'email' | 'slack'
  destination: string
  triggeredValue: number
  threshold: number
  message: string
  agentRunId?: string
}

interface AlertChannels {
  email?: {
    enabled?: boolean
    recipients?: string[]
  }
}

export async function dispatch(payload: NotificationPayload): Promise<void> {
  const alert = await prisma.alert.findUnique({
    where: { id: payload.alertId },
    select: { channels: true },
  })
  if (!alert) return

  const channels = alert.channels as AlertChannels
  const recipients = channels.email?.recipients ?? []
  const emailEnabled = channels.email?.enabled === true && recipients.length > 0
  const event = await prisma.alertEvent.create({
    data: {
      alertId: payload.alertId,
      projectId: payload.projectId,
      type: payload.alertType,
      triggeredValue: payload.triggeredValue,
      threshold: payload.threshold,
      message: payload.message,
      channel: emailEnabled ? 'email' : 'none',
      destination: emailEnabled ? recipients.join(',') : '',
      triggeredAt: new Date(),
      payload: {
        alertType: payload.alertType,
        triggeredValue: payload.triggeredValue,
        threshold: payload.threshold,
        message: payload.message,
        agentRunId: payload.agentRunId ?? null,
      },
      agentRunId: payload.agentRunId ?? null,
    },
  })

  logger.info({ alertId: payload.alertId, projectId: payload.projectId, ruleType: payload.alertType }, 'alert triggered')

  if (emailEnabled) {
    try {
      await sendEmail(payload, recipients)
      await prisma.alertEvent.update({ where: { id: event.id }, data: { deliveredAt: new Date() } })
      logger.info({ alertId: payload.alertId, recipientsCount: recipients.length }, 'alert email sent')
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      await prisma.alertEvent.update({ where: { id: event.id }, data: { error } })
      logger.error({ alertId: payload.alertId, error }, 'alert email failed')
    }
  } else if (payload.channel === 'slack') {
    await sendSlack(payload)
  } else {
    logger.debug({ alertId: payload.alertId }, 'Alert email disabled or has no recipients')
  }
}

async function sendEmail(payload: NotificationPayload, recipients: string[]): Promise<void> {
  const subject = `[Norn Alert] ${payload.alertType} triggered for ${payload.projectName}`
  const dashboardUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#dc2626;margin:0 0 16px">Alert Triggered</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#6b7280;width:140px">Project</td><td style="padding:8px 0;font-weight:600">${payload.projectName}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Alert type</td><td style="padding:8px 0;font-weight:600">${payload.alertType}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Current value</td><td style="padding:8px 0;font-weight:600">${payload.triggeredValue}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Threshold</td><td style="padding:8px 0;font-weight:600">${payload.threshold}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Message</td><td style="padding:8px 0">${payload.message}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0">${new Date().toISOString()}</td></tr>
  </table>
  <a href="${dashboardUrl}/dashboard/alerts?project=${payload.projectId}" style="display:inline-block;margin-top:24px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none">View in Dashboard</a>
</div>`.trim()

  await sendAlertEmail({
    to: recipients.join(','),
    subject,
    html,
    alertId: payload.alertId,
  })
}

async function sendSlack(payload: NotificationPayload): Promise<void> {
  const body = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `Norn Alert: ${payload.alertType}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Project*\n${payload.projectName}` },
          { type: 'mrkdwn', text: `*Alert type*\n${payload.alertType}` },
          { type: 'mrkdwn', text: `*Current value*\n${payload.triggeredValue}` },
          { type: 'mrkdwn', text: `*Threshold*\n${payload.threshold}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Message*: ${payload.message}` },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Triggered at ${new Date().toISOString()}` },
        ],
      },
    ],
  }

  try {
    const res = await fetch(payload.destination, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      logger.error({ alertId: payload.alertId, status: res.status }, 'Slack webhook returned non-200')
    } else {
      logger.info({ alertId: payload.alertId }, 'Slack notification sent')
    }
  } catch (err) {
    logger.error({ alertId: payload.alertId, err }, 'Failed to send Slack notification')
  }
}
