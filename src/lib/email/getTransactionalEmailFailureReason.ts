import type { ErrorResponse } from 'resend'

import type { TransactionalEmailFailureReason } from '@/lib/email/emailTypes'

export function getTransactionalEmailFailureReason(
  error: Pick<ErrorResponse, 'name'>
): TransactionalEmailFailureReason {
  return error.name === 'invalid_idempotent_request' ?
      'already_registered'
    : 'provider_rejected'
}
