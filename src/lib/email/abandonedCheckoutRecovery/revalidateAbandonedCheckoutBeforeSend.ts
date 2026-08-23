import { shopifyAdminGraphql } from '@/lib/shopify/shopifyAdminGraphql'

import {
  authorizeAbandonedCheckoutRecoverySend,
  type AbandonedCheckoutRecoveryPreSendClaim,
  type AuthorizeAbandonedCheckoutRecoverySendResult,
  type ShopifyAbandonedCheckoutPreSendState
} from './authorizeAbandonedCheckoutRecoverySend'
import { fetchShopifyAbandonedCheckoutPreSendState } from './fetchShopifyAbandonedCheckoutPreSendState'
import { resolveCheckoutRecoveryEmailMarketingAcceptance } from './resolveCheckoutRecoveryEmailMarketingAcceptance'

type RevalidateAbandonedCheckoutBeforeSendDependencies = {
  fetchState: (
    abandonedCheckoutId: string
  ) => Promise<ShopifyAbandonedCheckoutPreSendState>
  resolveCheckoutEmailMarketingAcceptance?: (
    state: ShopifyAbandonedCheckoutPreSendState
  ) => Promise<boolean>
}

const defaultDependencies: RevalidateAbandonedCheckoutBeforeSendDependencies =
  {
    fetchState: abandonedCheckoutId =>
      fetchShopifyAbandonedCheckoutPreSendState({
        abandonedCheckoutId,
        executeAdminGraphql: ({ query, variables }) =>
          shopifyAdminGraphql<unknown>(query, variables)
      })
  }

export async function revalidateAbandonedCheckoutBeforeSend(
  claim: AbandonedCheckoutRecoveryPreSendClaim,
  dependencies: RevalidateAbandonedCheckoutBeforeSendDependencies = defaultDependencies
): Promise<AuthorizeAbandonedCheckoutRecoverySendResult> {
  try {
    const state = await dependencies.fetchState(
      claim.shopifyAbandonedCheckoutId
    )

    const shouldResolveCheckoutAcceptance =
      state.customer.email?.marketingState === 'NOT_SUBSCRIBED'
      && Boolean(state.checkout.beginCheckoutEventId)

    const checkoutEmailMarketingAccepted =
      shouldResolveCheckoutAcceptance ?
        await (
          dependencies.resolveCheckoutEmailMarketingAcceptance
          ?? (currentState => {
            const email = currentState.customer.email
            const beginCheckoutEventId =
              currentState.checkout.beginCheckoutEventId

            if (!email || !beginCheckoutEventId) {
              return Promise.resolve(false)
            }

            return resolveCheckoutRecoveryEmailMarketingAcceptance({
              beginCheckoutEventId,
              email: email.address,
              checkoutCreatedAt: currentState.checkout.createdAt
            })
          })
        )(state)
      : false

    return authorizeAbandonedCheckoutRecoverySend({
      claim,
      state: {
        ...state,
        checkout: {
          ...state.checkout,
          checkoutEmailMarketingAccepted
        }
      }
    })
  } catch {
    throw new Error(
      'abandoned_checkout_recovery_revalidation_failed'
    )
  }
}
