import type { CustomerEmailMarketingState } from './abandonedCheckoutRecovery'

export type ShopifyAbandonmentEmailState =
  | 'NOT_SENT'
  | 'SCHEDULED'
  | 'SENT'

export type AbandonedCheckoutRecoveryPreSendClaim = {
  dispatchId: string
  shopifyAbandonedCheckoutId: string
  shopifyCustomerId: string
  checkoutCreatedAt: string
  checkoutUpdatedAt: string
}

export type ShopifyAbandonedCheckoutPreSendState = {
  abandonmentId: string
  createdAt: string
  customerHasNoDraftOrderSinceAbandonment: boolean
  customerHasNoOrderSinceAbandonment: boolean
  emailSentAt: string | null
  emailState: ShopifyAbandonmentEmailState | null
  inventoryAvailable: boolean
  isMostSignificantAbandonment: boolean
  staycomfyDiscountActive: boolean
  customer: {
    id: string
    email: {
      address: string
      marketingState: CustomerEmailMarketingState
      validFormat: boolean
    } | null
  }
  checkout: {
    id: string
    customerId: string | null
    createdAt: string
    updatedAt: string
    completedAt: string | null
    recoveryUrl: string
    containsComfyrobe: boolean
  }
}

export type AbandonedCheckoutRecoveryPreSendSuppressionReason =
  | 'recovered'
  | 'customer_has_orders'
  | 'draft_order_since_abandonment'
  | 'superseded_by_newer_checkout'
  | 'inventory_unavailable'
  | 'shopify_email_already_sent'
  | 'shopify_email_scheduled'
  | 'missing_email'
  | 'invalid_email'
  | 'not_subscribed'

export type AuthorizeAbandonedCheckoutRecoverySendResult =
  | {
      authorized: true
      to: string
      recoveryUrl: string
      offerType: 'generic' | 'staycomfy'
    }
  | {
      authorized: false
      suppressionReason: AbandonedCheckoutRecoveryPreSendSuppressionReason
    }

const INVALID_STATE_ERROR =
  'abandoned_checkout_recovery_shopify_state_invalid'

function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    throw new Error(INVALID_STATE_ERROR)
  }

  return timestamp
}

function assertValidIdentityAndTimeline(
  claim: AbandonedCheckoutRecoveryPreSendClaim,
  state: ShopifyAbandonedCheckoutPreSendState
): void {
  const claimedCreatedAt = parseTimestamp(
    claim.checkoutCreatedAt
  )
  const claimedUpdatedAt = parseTimestamp(
    claim.checkoutUpdatedAt
  )
  const checkoutCreatedAt = parseTimestamp(
    state.checkout.createdAt
  )
  const checkoutUpdatedAt = parseTimestamp(
    state.checkout.updatedAt
  )
  const abandonmentCreatedAt = parseTimestamp(state.createdAt)

  if (
    state.checkout.id !== claim.shopifyAbandonedCheckoutId ||
    state.customer.id !== claim.shopifyCustomerId ||
    state.checkout.customerId !== claim.shopifyCustomerId ||
    checkoutCreatedAt !== claimedCreatedAt ||
    checkoutUpdatedAt < claimedUpdatedAt ||
    checkoutUpdatedAt < checkoutCreatedAt ||
    abandonmentCreatedAt < checkoutCreatedAt ||
    state.emailState === null
  ) {
    throw new Error(INVALID_STATE_ERROR)
  }

  let recoveryUrl: URL

  try {
    recoveryUrl = new URL(state.checkout.recoveryUrl)
  } catch {
    throw new Error(INVALID_STATE_ERROR)
  }

  if (
    recoveryUrl.protocol !== 'https:' ||
    recoveryUrl.username !== '' ||
    recoveryUrl.password !== '' ||
    recoveryUrl.hostname === ''
  ) {
    throw new Error(INVALID_STATE_ERROR)
  }
}

export function authorizeAbandonedCheckoutRecoverySend(input: {
  claim: AbandonedCheckoutRecoveryPreSendClaim
  state: ShopifyAbandonedCheckoutPreSendState
}): AuthorizeAbandonedCheckoutRecoverySendResult {
  const { claim, state } = input

  assertValidIdentityAndTimeline(claim, state)

  if (state.checkout.completedAt !== null) {
    return { authorized: false, suppressionReason: 'recovered' }
  }

  if (!state.customerHasNoOrderSinceAbandonment) {
    return {
      authorized: false,
      suppressionReason: 'customer_has_orders'
    }
  }

  if (!state.customerHasNoDraftOrderSinceAbandonment) {
    return {
      authorized: false,
      suppressionReason: 'draft_order_since_abandonment'
    }
  }

  if (!state.isMostSignificantAbandonment) {
    return {
      authorized: false,
      suppressionReason: 'superseded_by_newer_checkout'
    }
  }

  if (!state.inventoryAvailable) {
    return {
      authorized: false,
      suppressionReason: 'inventory_unavailable'
    }
  }

  if (
    state.emailState === 'SENT' ||
    state.emailSentAt !== null
  ) {
    return {
      authorized: false,
      suppressionReason: 'shopify_email_already_sent'
    }
  }

  if (state.emailState === 'SCHEDULED') {
    return {
      authorized: false,
      suppressionReason: 'shopify_email_scheduled'
    }
  }

  if (!state.customer.email) {
    return {
      authorized: false,
      suppressionReason: 'missing_email'
    }
  }

  if (!state.customer.email.validFormat) {
    return {
      authorized: false,
      suppressionReason: 'invalid_email'
    }
  }

  if (state.customer.email.marketingState !== 'SUBSCRIBED') {
    return {
      authorized: false,
      suppressionReason: 'not_subscribed'
    }
  }

  return {
    authorized: true,
    to: state.customer.email.address,
    recoveryUrl: state.checkout.recoveryUrl,
    offerType:
      state.checkout.containsComfyrobe &&
      state.staycomfyDiscountActive ?
        'staycomfy'
      : 'generic'
  }
}
