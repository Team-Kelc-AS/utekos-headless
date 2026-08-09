import 'server-only'

import { render } from '@react-email/render'
import { createElement } from 'react'

import {
  AbandonedCheckoutRecoveryEmail,
  getAbandonedCheckoutRecoverySubject
} from '@/components/emails/AbandonedCheckoutRecoveryEmail'
import {
  formatFromAddress,
  getEmailConfig
} from '@/lib/email/config'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

import {
  getAbandonedCheckoutRecoveryOneClickUnsubscribeUrl,
  getAbandonedCheckoutRecoveryUnsubscribeUrl
} from './abandonedCheckoutRecoveryUnsubscribeToken'
import type { AbandonedCheckoutRecoveryDeliveryPort } from './abandonedCheckoutRecoveryDispatch'

function assertStep(step: number): asserts step is 1 | 2 | 3 {
  if (step !== 1 && step !== 2 && step !== 3) {
    throw new Error('abandoned_checkout_recovery_step_invalid')
  }
}

function buildPlainText(input: {
  step: 1 | 2 | 3
  offerType: 'generic' | 'staycomfy'
  recoveryUrl: string
  unsubscribeUrl: string
}): string {
  const lines = [
    getAbandonedCheckoutRecoverySubject(input.step),
    '',
    input.step === 3 ?
      'Dette er den siste e-posten vi sender om denne kassen.'
    : 'Du kan fortsette akkurat der du slapp.'
  ]

  if (input.offerType === 'staycomfy') {
    lines.push(
      '',
      '200 kr rabatt per Comfyrobe + gratis frakt',
      'Bruk koden STAYCOMFY i kassen. Koden gjelder én gang per kunde og kan ikke kombineres med andre rabatter.'
    )
  }

  lines.push(
    '',
    `Fortsett til kassen: ${input.recoveryUrl}`,
    '',
    'Tilgjengelighet og endelig pris bekreftes i Shopify-kassen.',
    '',
    `Meld deg av: ${input.unsubscribeUrl}`
  )

  return lines.join('\n')
}

export const deliverAbandonedCheckoutRecoveryEmail:
AbandonedCheckoutRecoveryDeliveryPort = async input => {
  assertStep(input.step)

  const unsubscribeUrl =
    getAbandonedCheckoutRecoveryUnsubscribeUrl(input.dispatchId)
  const oneClickUnsubscribeUrl =
    getAbandonedCheckoutRecoveryOneClickUnsubscribeUrl(input.dispatchId)
  const emailProps = {
    step: input.step,
    offerType: input.offerType,
    recoveryUrl: input.recoveryUrl,
    unsubscribeUrl
  } as const
  const html = await render(
    createElement(AbandonedCheckoutRecoveryEmail, emailProps)
  )
  const { fromEmail, fromName } = getEmailConfig()
  const result = await sendTransactionalEmail({
    from: formatFromAddress(fromName, fromEmail),
    to: input.to,
    subject: getAbandonedCheckoutRecoverySubject(input.step),
    idempotencyKey: input.idempotencyKey,
    replyTo: 'kundeservice@utekos.no',
    html,
    text: buildPlainText(emailProps),
    headers: {
      'List-Unsubscribe': `<${oneClickUnsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    },
    tags: [
      { name: 'category', value: 'abandoned_checkout_recovery' },
      { name: 'dispatch_id', value: input.dispatchId },
      { name: 'sequence', value: String(input.sequenceVersion) },
      { name: 'step', value: String(input.step) },
      { name: 'offer', value: input.offerType }
    ]
  })

  return result.ok ?
      { ok: true, resendEmailId: result.id }
    : { ok: false }
}
