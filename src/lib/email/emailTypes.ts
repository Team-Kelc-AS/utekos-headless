export type TransactionalEmailFailureReason =
  | 'already_registered'
  | 'provider_rejected'

export type SendTransactionalEmailResult =
  | { ok: true; id: string }
  | {
      ok: false
      message: string
      reason: TransactionalEmailFailureReason
    }
