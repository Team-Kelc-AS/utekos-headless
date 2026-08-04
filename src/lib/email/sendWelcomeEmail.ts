import 'server-only'

import {
  formatFromAddress,
  getEmailConfig
} from '@/lib/email/config'
import type { SendTransactionalEmailResult } from '@/lib/email/emailTypes'
import {
  NEWSLETTER_WELCOME_HTML,
  NEWSLETTER_WELCOME_SUBJECT,
  NEWSLETTER_WELCOME_TEXT
} from '@/lib/email/newsletterWelcomeBroadcastContent'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

const NEWSLETTER_EMAIL_VERSION = 'comfyrobe-broadcast-202608'

function buildNewsletterIdempotencyKey(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()

  return [
    'newsletter-welcome',
    NEWSLETTER_EMAIL_VERSION,
    normalizedEmail
  ].join('/')
}

export async function sendWelcomeEmail(
  email: string
): Promise<SendTransactionalEmailResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const { fromEmail, fromName } = getEmailConfig()

  return sendTransactionalEmail({
    from: formatFromAddress(fromName, fromEmail),
    to: normalizedEmail,
    subject: NEWSLETTER_WELCOME_SUBJECT,
    idempotencyKey:
      buildNewsletterIdempotencyKey(normalizedEmail),
    replyTo: 'kundeservice@utekos.no',
    html: NEWSLETTER_WELCOME_HTML,
    text: NEWSLETTER_WELCOME_TEXT
  })
}
