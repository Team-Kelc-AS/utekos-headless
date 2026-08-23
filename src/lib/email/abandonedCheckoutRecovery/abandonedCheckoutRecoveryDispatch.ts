import type {
  AbandonedCheckoutRecoveryEmailLineItem,
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
    shopifyCustomerId: string
    sequenceVersion: number
    step: number
    to: string
    recoveryUrl: string
    lineItems: AbandonedCheckoutRecoveryEmailLineItem[]
    idempotencyKey: string
  }
) => Promise<unknown>
