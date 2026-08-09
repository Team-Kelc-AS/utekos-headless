import 'server-only'

import { z } from 'zod'

import { shopifyAdminGraphql } from '@/lib/shopify/shopifyAdminGraphql'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database.types'

import { verifyAbandonedCheckoutRecoveryUnsubscribeToken } from './abandonedCheckoutRecoveryUnsubscribeToken'

type SuppressForCustomerArgs = {
  p_shopify_customer_id: string
  p_now: string
}

type UnsubscribeDatabase = Omit<Database, 'ops'> & {
  ops: Omit<Database['ops'], 'Functions'> & {
    Functions: Database['ops']['Functions'] & {
      suppress_abandoned_checkout_recovery_dispatches_for_customer: {
        Args: SuppressForCustomerArgs
        Returns: number
      }
    }
  }
}

const ShopifyResponseSchema = z.object({
  customerEmailMarketingConsentUpdate: z.object({
    customer: z.object({
      id: z.string(),
      defaultEmailAddress: z.object({
        marketingState: z.literal('UNSUBSCRIBED')
      }).nullable()
    }).nullable(),
    userErrors: z.array(z.object({ message: z.string() }))
  })
})

async function getCustomerIdForDispatch(
  dispatchId: string
): Promise<string> {
  const client = createSupabaseAdminClient<UnsubscribeDatabase>()
  const { data, error } = await client
    .schema('ops')
    .from('abandoned_checkout_recovery_dispatches')
    .select('shopify_customer_id')
    .eq('id', dispatchId)
    .maybeSingle()

  const customerId = data?.shopify_customer_id

  if (
    error ||
    !customerId ||
    !/^gid:\/\/shopify\/Customer\/[0-9]+$/.test(customerId)
  ) {
    throw new Error('abandoned_checkout_recovery_unsubscribe_dispatch_invalid')
  }

  return customerId
}

async function updateShopifyConsent(customerId: string): Promise<void> {
  const response = await shopifyAdminGraphql<unknown>(
    `#graphql
      mutation UnsubscribeAbandonedCheckoutRecovery(
        $input: CustomerEmailMarketingConsentUpdateInput!
      ) {
        customerEmailMarketingConsentUpdate(input: $input) {
          customer {
            id
            defaultEmailAddress {
              marketingState
            }
          }
          userErrors {
            message
          }
        }
      }
    `,
    {
      input: {
        customerId,
        emailMarketingConsent: {
          marketingState: 'UNSUBSCRIBED',
          consentUpdatedAt: new Date().toISOString()
        }
      }
    }
  )
  const parsed = ShopifyResponseSchema.safeParse(response)
  const mutation = parsed.success ?
      parsed.data.customerEmailMarketingConsentUpdate
    : null

  if (
    !mutation ||
    mutation.userErrors.length > 0 ||
    mutation.customer?.id !== customerId ||
    mutation.customer.defaultEmailAddress?.marketingState !== 'UNSUBSCRIBED'
  ) {
    throw new Error('abandoned_checkout_recovery_unsubscribe_shopify_failed')
  }
}

async function suppressRemainingDispatches(customerId: string): Promise<number> {
  const client = createSupabaseAdminClient<UnsubscribeDatabase>()
  const { data, error } = await client
    .schema('ops')
    .rpc(
      'suppress_abandoned_checkout_recovery_dispatches_for_customer',
      {
        p_shopify_customer_id: customerId,
        p_now: new Date().toISOString()
      }
    )

  if (error || typeof data !== 'number') {
    throw new Error('abandoned_checkout_recovery_unsubscribe_suppress_failed')
  }

  return data
}

export async function unsubscribeAbandonedCheckoutRecovery(
  token: string
): Promise<{ suppressed: number }> {
  const dispatchId =
    verifyAbandonedCheckoutRecoveryUnsubscribeToken(token)

  if (!dispatchId) {
    throw new Error('abandoned_checkout_recovery_unsubscribe_token_invalid')
  }

  const customerId = await getCustomerIdForDispatch(dispatchId)
  await updateShopifyConsent(customerId)
  const suppressed = await suppressRemainingDispatches(customerId)

  return { suppressed }
}
