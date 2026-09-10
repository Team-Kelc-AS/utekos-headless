import 'server-only'

import {
  formatFromAddress,
  getEmailConfig
} from '@/lib/email/config'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

import type {
  ShopifyTransactionalEmailNotificationType
} from './shopifyTransactionalEmailEvidenceContract'
import type {
  ShopifyTransactionalEmailOrder
} from './fetchShopifyTransactionalEmailOrder'
import {
  getShopifyTransactionalEmailContent
} from './getShopifyTransactionalEmailContent'

export async function deliverShopifyTransactionalEmail(
  input: {
    notificationType: ShopifyTransactionalEmailNotificationType
    order: ShopifyTransactionalEmailOrder
    idempotencyKey: string
  }
) {
  if (!input.order.email) {
    throw new Error(
      'shopify_transactional_email_recipient_missing'
    )
  }

  const emailConfig = getEmailConfig()
  const content = getShopifyTransactionalEmailContent({
    notificationType: input.notificationType,
    order: input.order
  })
  const orderId = input.order.id.split('/').at(-1)

  return sendTransactionalEmail({
    from: formatFromAddress(
      emailConfig.fromName,
      emailConfig.fromEmail
    ),
    to: input.order.email,
    subject: content.subject,
    idempotencyKey: input.idempotencyKey,
    replyTo: emailConfig.fromEmail,
    tags: [
      {
        name: 'source',
        value: 'shopify_transactional'
      },
      {
        name: 'notification',
        value: input.notificationType
      },
      {
        name: 'order_id',
        value: orderId ?? 'unknown'
      }
    ],
    html: content.html,
    text: content.text
  })
}
