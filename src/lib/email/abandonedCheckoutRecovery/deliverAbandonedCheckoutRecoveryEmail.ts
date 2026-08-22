import 'server-only'

import {
  formatFromAddress,
  getEmailConfig
} from '@/lib/email/config'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

import {
  getAbandonedCheckoutRecoveryEmailContent
} from './abandonedCheckoutRecoveryEmailContent'
import {
  createAbandonedCheckoutRecoveryUnsubscribeUrl
} from './abandonedCheckoutRecoveryUnsubscribeToken'
import type {
  AbandonedCheckoutRecoveryDeliveryPort
} from './abandonedCheckoutRecoveryDispatch'

export const deliverAbandonedCheckoutRecoveryEmail:
  AbandonedCheckoutRecoveryDeliveryPort = async input => {
    const emailConfig = getEmailConfig()
    const unsubscribeUrl =
      createAbandonedCheckoutRecoveryUnsubscribeUrl({
        shopifyCustomerId: input.shopifyCustomerId
      })
    const content = getAbandonedCheckoutRecoveryEmailContent({
      step: input.step,
      recoveryUrl: input.recoveryUrl,
      unsubscribeUrl
    })

    const result = await sendTransactionalEmail({
      from: formatFromAddress(
        emailConfig.fromName,
        emailConfig.fromEmail
      ),
      to: input.to,
      subject: content.subject,
      idempotencyKey: input.idempotencyKey,
      replyTo: emailConfig.fromEmail,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post':
          'List-Unsubscribe=One-Click'
      },
      tags: [
        {
          name: 'source',
          value: 'abandoned_checkout_recovery'
        },
        {
          name: 'sequence_version',
          value: String(input.sequenceVersion)
        },
        {
          name: 'step',
          value: String(input.step)
        },
        {
          name: 'dispatch_id',
          value: input.dispatchId
        }
      ],
      html: content.html,
      text: content.text
    })

    return result.ok
      ? {
          ok: true as const,
          resendEmailId: result.id
        }
      : {
          ok: false as const
        }
  }
