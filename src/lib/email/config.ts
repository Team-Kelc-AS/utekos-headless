import 'server-only'

import { z } from 'zod'

import { resolveResendApiKey } from '@/lib/email/resolveResendApiKey'

const EmailEnvSchema = z.object({
  apiKey: z.string().min(1),
  fromEmail: z.string().email().default('kundeservice@utekos.no'),
  fromName: z.string().min(1).default('Utekos'),
  contactFormSendToEmail: z.string().email().optional()
})

export type EmailConfig = {
  apiKey: string
  fromEmail: string
  fromName: string
  contactFormSendToEmail: string | undefined
}

let cachedConfig: EmailConfig | null = null

function parseEmailConfig(): EmailConfig {
  const apiKey = resolveResendApiKey()

  const parsed = EmailEnvSchema.safeParse({
    apiKey,
    fromEmail: process.env.RESEND_FROM_EMAIL,
    fromName: process.env.RESEND_FROM_NAME,
    contactFormSendToEmail: process.env.CONTACT_FORM_SEND_TO_EMAIL
  })

  if (!parsed.success) {
    const message = parsed.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid Resend email configuration: ${message}`)
  }

  return {
    apiKey: parsed.data.apiKey,
    fromEmail: parsed.data.fromEmail,
    fromName: parsed.data.fromName,
    contactFormSendToEmail: parsed.data.contactFormSendToEmail
  }
}

export function getEmailConfig(): EmailConfig {
  if (!cachedConfig) {
    cachedConfig = parseEmailConfig()
  }

  return cachedConfig
}

export function formatFromAddress(displayName: string, email: string): string {
  return `${displayName} <${email}>`
}

export function requireInternalNotificationRecipient(): string {
  const { contactFormSendToEmail } = getEmailConfig()

  if (!contactFormSendToEmail) {
    throw new Error('CONTACT_FORM_SEND_TO_EMAIL is not configured')
  }

  return contactFormSendToEmail
}
