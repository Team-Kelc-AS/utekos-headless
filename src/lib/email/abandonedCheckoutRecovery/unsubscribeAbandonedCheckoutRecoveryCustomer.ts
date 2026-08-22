import 'server-only'

import { z } from 'zod'

import { shopifyAdminGraphql } from '@/lib/shopify/shopifyAdminGraphql'
import type { Database } from '@/types/supabase/database.types'

const CUSTOMER_ID_PATTERN = /^gid:\/\/shopify\/Customer\/[0-9]+$/

const unsubscribeMutation = `#graphql
  mutation AbandonedCheckoutRecoveryUnsubscribe(
    $input: CustomerEmailMarketingConsentUpdateInput!
  ) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
        defaultEmailAddress {
          marketingState
          marketingUpdatedAt
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

const shopifyResultSchema = z.strictObject({
  customerEmailMarketingConsentUpdate: z.strictObject({
    customer: z.object({
      id: z.string().regex(CUSTOMER_ID_PATTERN),
      defaultEmailAddress: z.object({
        marketingState: z.literal('UNSUBSCRIBED'),
        marketingUpdatedAt: z.string().datetime({ offset: true })
      }).nullable()
    }).nullable(),
    userErrors: z.array(z.object({
      field: z.array(z.string()).nullable().optional(),
      message: z.string()
    }))
  })
})

type SuppressRpcArgs = {
  p_shopify_customer_id: string
  p_now: string
}

type UnsubscribeDatabase = Omit<Database, 'ops'> & {
  ops: Omit<Database['ops'], 'Functions'> & {
    Functions: Database['ops']['Functions'] & {
      suppress_abandoned_checkout_recovery_dispatches_for_customer: {
        Args: SuppressRpcArgs
        Returns: number
      }
    }
  }
}

type Dependencies = {
  updateShopify?: (
    customerId: string,
    now: Date
  ) => Promise<unknown>
  suppressPending?: (
    customerId: string,
    now: Date
  ) => Promise<number>
}

async function updateShopify(
  customerId: string,
  now: Date
): Promise<unknown> {
  return shopifyAdminGraphql<unknown>(
    unsubscribeMutation,
    {
      input: {
        customerId,
        emailMarketingConsent: {
          marketingState: 'UNSUBSCRIBED',
          consentUpdatedAt: now.toISOString()
        }
      }
    }
  )
}

async function suppressPending(
  customerId: string,
  now: Date
): Promise<number> {
  const { createSupabaseAdminClient } =
    await import('@/lib/supabase/server')
  const client = createSupabaseAdminClient<UnsubscribeDatabase>()
  const { data, error } = await client
    .schema('ops')
    .rpc(
      'suppress_abandoned_checkout_recovery_dispatches_for_customer',
      {
        p_shopify_customer_id: customerId,
        p_now: now.toISOString()
      }
    )

  if (error || !Number.isInteger(data) || data < 0) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_persist_failed'
    )
  }

  return data
}

export async function unsubscribeAbandonedCheckoutRecoveryCustomer(
  input: {
    shopifyCustomerId: string
    now?: Date
  },
  dependencies: Dependencies = {}
): Promise<{ suppressedDispatches: number }> {
  const now = input.now ?? new Date()

  if (
    !CUSTOMER_ID_PATTERN.test(input.shopifyCustomerId)
    || !Number.isFinite(now.getTime())
  ) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_input_invalid'
    )
  }

  const rawShopifyResult = await (
    dependencies.updateShopify ?? updateShopify
  )(input.shopifyCustomerId, now)
  const shopifyResult = shopifyResultSchema.safeParse(
    rawShopifyResult
  )

  if (
    !shopifyResult.success
    || shopifyResult.data
      .customerEmailMarketingConsentUpdate
      .userErrors.length > 0
    || shopifyResult.data
      .customerEmailMarketingConsentUpdate
      .customer?.id !== input.shopifyCustomerId
    || !shopifyResult.data
      .customerEmailMarketingConsentUpdate
      .customer.defaultEmailAddress
  ) {
    throw new Error(
      'abandoned_checkout_recovery_unsubscribe_shopify_failed'
    )
  }

  const suppressedDispatches = await (
    dependencies.suppressPending ?? suppressPending
  )(input.shopifyCustomerId, now)

  return { suppressedDispatches }
}
