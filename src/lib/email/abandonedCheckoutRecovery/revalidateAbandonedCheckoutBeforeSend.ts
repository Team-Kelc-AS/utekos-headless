import { shopifyAdminGraphql } from '@/lib/shopify/shopifyAdminGraphql'

import {
  authorizeAbandonedCheckoutRecoverySend,
  type AbandonedCheckoutRecoveryPreSendClaim,
  type AuthorizeAbandonedCheckoutRecoverySendResult,
  type ShopifyAbandonedCheckoutPreSendState
} from './authorizeAbandonedCheckoutRecoverySend'
import { fetchShopifyAbandonedCheckoutPreSendState } from './fetchShopifyAbandonedCheckoutPreSendState'

type RevalidateAbandonedCheckoutBeforeSendDependencies = {
  fetchState: (
    abandonedCheckoutId: string
  ) => Promise<ShopifyAbandonedCheckoutPreSendState>
}

const defaultDependencies: RevalidateAbandonedCheckoutBeforeSendDependencies =
  {
    fetchState: abandonedCheckoutId =>
      fetchShopifyAbandonedCheckoutPreSendState({
        abandonedCheckoutId,
        comfyrobeProductId:
          requireComfyrobeProductId(),
        executeAdminGraphql: ({ query, variables }) =>
          shopifyAdminGraphql<unknown>(query, variables)
      })
  }

function requireComfyrobeProductId(): string {
  const productId = process.env.STAYCOMFY_COMFYROBE_PRODUCT_ID

  if (!productId?.startsWith('gid://shopify/Product/')) {
    throw new Error(
      'abandoned_checkout_recovery_comfyrobe_product_id_invalid'
    )
  }

  return productId
}

export async function revalidateAbandonedCheckoutBeforeSend(
  claim: AbandonedCheckoutRecoveryPreSendClaim,
  dependencies: RevalidateAbandonedCheckoutBeforeSendDependencies = defaultDependencies
): Promise<AuthorizeAbandonedCheckoutRecoverySendResult> {
  try {
    const state = await dependencies.fetchState(
      claim.shopifyAbandonedCheckoutId
    )

    return authorizeAbandonedCheckoutRecoverySend({
      claim,
      state
    })
  } catch {
    throw new Error(
      'abandoned_checkout_recovery_revalidation_failed'
    )
  }
}
