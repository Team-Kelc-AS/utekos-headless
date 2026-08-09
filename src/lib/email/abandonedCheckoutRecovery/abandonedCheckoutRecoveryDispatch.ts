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
    dispatchId: string
    to: string
    recoveryUrl: string
    idempotencyKey: string
    sequenceVersion: number
    step: number
    offerType: 'generic' | 'staycomfy'
  }
) => Promise<unknown>
