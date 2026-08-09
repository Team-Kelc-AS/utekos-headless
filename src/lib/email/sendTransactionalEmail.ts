import 'server-only'

import type { ReactElement } from 'react'

import { getResendClient } from '@/lib/email/client'
import type { SendTransactionalEmailResult } from '@/lib/email/emailTypes'
import { getTransactionalEmailFailureReason } from '@/lib/email/getTransactionalEmailFailureReason'

type SendTransactionalEmailInput = {
  from: string
  to: string | string[]
  subject: string
  idempotencyKey: string
  replyTo?: string
  headers?: Record<string, string>
  tags?: Array<{ name: string; value: string }>
} & ({ react: ReactElement } | { html: string; text: string })

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<SendTransactionalEmailResult> {
  const resend = getResendClient()

  const { data, error } =
    'react' in input ?
      await resend.emails.send(
        {
          from: input.from,
          to: input.to,
          subject: input.subject,
          ...(input.replyTo ? { replyTo: input.replyTo } : {}),
          ...(input.headers ? { headers: input.headers } : {}),
          ...(input.tags ? { tags: input.tags } : {}),
          react: input.react
        },
        { idempotencyKey: input.idempotencyKey }
      )
    : await resend.emails.send(
        {
          from: input.from,
          to: input.to,
          subject: input.subject,
          ...(input.replyTo ? { replyTo: input.replyTo } : {}),
          ...(input.headers ? { headers: input.headers } : {}),
          ...(input.tags ? { tags: input.tags } : {}),
          html: input.html,
          text: input.text
        },
        { idempotencyKey: input.idempotencyKey }
      )

  if (error) {
    return {
      ok: false,
      message: error.message,
      reason: getTransactionalEmailFailureReason(error)
    }
  }

  if (!data?.id) {
    return {
      ok: false,
      message: 'Resend returned no email id',
      reason: 'provider_rejected'
    }
  }

  return { ok: true, id: data.id }
}
