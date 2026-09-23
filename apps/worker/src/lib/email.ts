import pino from 'pino'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { env } from '../env'

const logger = pino({ name: 'email' })

export interface AlertEmailPayload {
  to: string
  subject: string
  html: string
  text?: string
  alertId?: string
}

export async function sendAlertEmail({ to, subject, html, text, alertId }: AlertEmailPayload): Promise<void> {
  try {
    if (env.EMAIL_TRANSPORT === 'resend') {
      if (!env.RESEND_API_KEY) {
        logger.warn({ alertId }, 'RESEND_API_KEY not set - skipping email notification')
        return
      }

      const resend = new Resend(env.RESEND_API_KEY)
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to,
        subject,
        html,
      })
    } else {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT),
        secure: false,
        ignoreTLS: true,
      })

      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      })
    }

    logger.info({ alertId, to, transport: env.EMAIL_TRANSPORT }, 'Email notification sent')
  } catch (err) {
    logger.error({ alertId, err }, 'Failed to send email notification')
  }
}
