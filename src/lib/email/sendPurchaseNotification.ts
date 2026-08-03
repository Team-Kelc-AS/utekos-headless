import 'server-only'

import {
  formatFromAddress,
  getEmailConfig,
  requireInternalNotificationRecipient
} from '@/lib/email/config'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'
import type { CanonicalPurchase } from '@/lib/analytics/purchaseEvent'

type SendPurchaseNotificationDependencies = {
  getConfig: typeof getEmailConfig
  getRecipient: typeof requireInternalNotificationRecipient
  sendEmail: typeof sendTransactionalEmail
}

const defaultDependencies: SendPurchaseNotificationDependencies = {
  getConfig: getEmailConfig,
  getRecipient: requireInternalNotificationRecipient,
  sendEmail: sendTransactionalEmail
}

export type SendPurchaseNotificationResult =
  | { delivery: 'already_sent' | 'sent'; ok: true }
  | { ok: false; reason: 'provider_rejected' }

function formatAmount(value: number, currency: string) {
  return `${value.toLocaleString('nb-NO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })} ${currency}`
}

export async function sendPurchaseNotification(
  purchase: CanonicalPurchase,
  dependencies: SendPurchaseNotificationDependencies =
    defaultDependencies
): Promise<SendPurchaseNotificationResult> {
  const { fromEmail } = dependencies.getConfig()
  const amount = formatAmount(
    purchase.custom_data.value,
    purchase.custom_data.currency
  )
  const itemCount = purchase.custom_data.items.length
  const result = await dependencies.sendEmail({
    from: formatFromAddress('Utekos Kjøpsvarsel', fromEmail),
    to: dependencies.getRecipient(),
    subject: `Nytt kjøp registrert: ${amount}`,
    idempotencyKey: `purchase-notification/${purchase.event_id}`,
    html:
      '<p>Et nytt betalt kjøp er registrert.</p>' +
      `<p><strong>Beløp:</strong> ${amount}<br>` +
      `<strong>Varelinjer:</strong> ${itemCount}</p>` +
      '<p>Åpne Shopify Admin for ordredetaljer.</p>',
    text:
      'Et nytt betalt kjøp er registrert.\n\n' +
      `Beløp: ${amount}\n` +
      `Varelinjer: ${itemCount}\n\n` +
      'Åpne Shopify Admin for ordredetaljer.'
  })

  if (result.ok) return { delivery: 'sent', ok: true }
  if (result.reason === 'already_registered') {
    return { delivery: 'already_sent', ok: true }
  }

  return { ok: false, reason: 'provider_rejected' }
}
