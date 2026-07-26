import 'server-only'

import { render } from '@react-email/render'

import { NEWSLETTER_DISCOUNT_PERCENT } from '@/components/newsletter-modal/newsletterModalConfig'
import { WelcomeEmail } from '@/components/emails/WelcomeEmail'
import {
  formatFromAddress,
  getEmailConfig
} from '@/lib/email/config'
import type { SendTransactionalEmailResult } from '@/lib/email/emailTypes'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

const NEWSLETTER_EMAIL_VERSION = 'staycomfy-v1'

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

  const emailElement = <WelcomeEmail email={normalizedEmail} />

  const emailHtml = await render(emailElement)

  const emailText = await render(emailElement, {
    plainText: true
  })

  return sendTransactionalEmail({
    from: formatFromAddress(fromName, fromEmail),
    to: normalizedEmail,
    subject: `Her er din ${NEWSLETTER_DISCOUNT_PERCENT} % rabatt på Comfyrobe`,
    idempotencyKey:
      buildNewsletterIdempotencyKey(normalizedEmail),
    replyTo: 'kundeservice@utekos.no',
    html: emailHtml,
    text: emailText
  })
}
