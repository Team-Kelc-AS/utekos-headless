import { createHash } from 'node:crypto'
import {
  captureDecision,
  isFullyCaptured,
  assertPaymentIdentity,
  VippsPaymentInvariantError
} from './payment'
import type { VippsPayment } from './payment'

export type VippsCheckoutIdentity = {
  environment: 'test' | 'production'
  msn: string
  reference: string
  amount: number
}

export function vippsCaptureKey(
  checkout: VippsCheckoutIdentity
) {
  // Same checkout, operation and amount => same key across workers and retries.
  return `capture-${createHash('sha256')
    .update(
      `${checkout.environment}:${checkout.msn}:${checkout.reference}:${checkout.amount}:full-v1`
    )
    .digest('hex')
    .slice(0, 48)}`
}

type Dependencies<T> = {
  getPayment(reference: string): Promise<VippsPayment>
  capture(
    reference: string,
    amount: number,
    key: string
  ): Promise<void>
  // Validate the saved Shopify draft's price, currency and delivery identity before charging.
  prepareOrder(payment: VippsPayment): Promise<void>
  // Must be durable/idempotent (one saved draft ID, read before complete).
  completePaidOrder(payment: VippsPayment): Promise<T>
}

/** Shared by signed webhooks and authenticated status reconciliation. Never invoked from SDK success alone. */
export async function captureAndComplete<T>(
  checkout: VippsCheckoutIdentity,
  dependencies: Dependencies<T>
) {
  let payment = await dependencies.getPayment(checkout.reference)
  const decision = captureDecision(
    payment,
    checkout.reference,
    checkout.amount
  )
  if (decision === 'wait' || decision === 'terminal')
    return { status: decision } as const
  await dependencies.prepareOrder(payment)
  if (decision === 'capture') {
    try {
      await dependencies.capture(
        checkout.reference,
        checkout.amount,
        vippsCaptureKey(checkout)
      )
    } catch {
      // Timeout/connection reset may mean the capture DID succeed. Never create a new operation/key.
      // Authoritative readback below resolves that ambiguity; a failed read propagates for retry.
    }
    payment = await dependencies.getPayment(checkout.reference)
    assertPaymentIdentity(
      payment,
      checkout.reference,
      checkout.amount
    )
  }
  if (!isFullyCaptured(payment, checkout.amount)) {
    throw new VippsPaymentInvariantError('capture_not_verified')
  }
  const order = await dependencies.completePaidOrder(payment)
  return { status: 'paid', order } as const
}
