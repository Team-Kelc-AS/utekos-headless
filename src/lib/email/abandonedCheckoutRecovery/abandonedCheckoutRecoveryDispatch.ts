import type {
  AbandonedCheckoutRecoveryPreSendClaim
} from './authorizeAbandonedCheckoutRecoverySend'

export type ClaimedAbandonedCheckoutRecoveryDispatch =
  AbandonedCheckoutRecoveryPreSendClaim & {
    sequenceVersion: number
    step: number
    dueAt: string
    attemptCount: number
    processingExpiresAt: string
  }

export type AbandonedCheckoutRecoveryDeliveryPort = (
  input: {
    to: string
    recoveryUrl: string
    idempotencyKey: string
  }
) => Promise<unknown>
