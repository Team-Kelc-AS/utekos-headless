import 'server-only'
import { z } from 'zod'
import type { VippsConfig } from './config'
import {
  assertPaymentIdentity,
  isFullyCaptured,
  VippsPaymentInvariantError,
  type VippsPayment
} from './payment'

const draftFields = 'id tags totalPriceSet { presentmentMoney { amount currencyCode } } order { id name displayFinancialStatus }'
export const vippsShopifyQueries = {
  productByHandle: `query VippsProductByHandle($identifier: ProductIdentifierInput!) { shop { currencyCode } product: productByIdentifier(identifier:$identifier) { id handle variants(first:250) { nodes { id price inventoryQuantity inventoryPolicy } } } }`,
  read: `query VippsDraft($id: ID!) { draftOrder(id:$id) { ${draftFields} } }`,
  create: `mutation VippsDraftCreate($input:DraftOrderInput!) { draftOrderCreate(input:$input) { draftOrder { ${draftFields} } userErrors { field message } } }`,
  update: `mutation VippsDraftUpdate($id:ID!,$input:DraftOrderInput!) { draftOrderUpdate(id:$id,input:$input) { draftOrder { ${draftFields} } userErrors { field message } } }`,
  complete: 'mutation VippsComplete($id:ID!) { draftOrderComplete(id:$id) { draftOrder { id order { id name displayFinancialStatus } } userErrors { field message } } }'
}
const orderSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayFinancialStatus: z.string()
})
const draftSchema = z.object({
  id: z.string(),
  tags: z.array(z.string()),
  totalPriceSet: z.object({
    presentmentMoney: z.object({
      amount: z.string(),
      currencyCode: z.literal('NOK')
    })
  }),
  order: orderSchema.nullable()
})
export type VippsDraft = z.infer<typeof draftSchema>
const variantSchema = z.object({
  id: z.string(),
  price: z.string(),
  inventoryQuantity: z.number().int().nullable(),
  inventoryPolicy: z.enum(['CONTINUE', 'DENY'])
})

type AdminToken = { value: string; expiresAt: number }

/**
 * The test app is installed with Shopify's client-credentials grant. Its token
 * expires after roughly one day, so it must be fetched server-side and kept
 * only in memory. Production continues to use the existing static server token.
 */
export function createVippsShopifyAdminTokenProvider(
  config: VippsConfig,
  domain: string,
  env: Record<string, string | undefined>,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now
) {
  const staticToken =
    config.environment === 'test' ?
      env.VIPPS_SHOPIFY_TEST_ADMIN_TOKEN
    : env.SHOPIFY_ADMIN_API_TOKEN
  if (staticToken) return async () => staticToken
  if (config.environment !== 'test')
    throw new Error('Vipps Shopify environment is not configured')
  const clientId = env.SHOPIFY_EVENTHANDLER_APP_CLIENT_ID
  const clientSecret = env.SHOPIFY_EVENTHANDLER_APP_CLIENT_SECRET
  if (!clientId || !clientSecret)
    throw new Error('Vipps Shopify test credentials are not configured')
  let cached: AdminToken | undefined
  let inflight: Promise<string> | undefined
  return async () => {
    if (cached && cached.expiresAt - now() > 60_000)
      return cached.value
    inflight ??= (async () => {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
      const response = await fetcher(
        `https://${domain}/admin/oauth/access_token`,
        {
          method: 'POST',
          cache: 'no-store',
          redirect: 'error',
          signal: AbortSignal.timeout(8000),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        }
      )
      const payload = z
        .object({
          access_token: z.string().min(1),
          expires_in: z.number().int().positive()
        })
        .safeParse(response.ok ? await response.json() : null)
      if (!payload.success)
        throw new Error('Vipps Shopify test token request failed')
      cached = {
        value: payload.data.access_token,
        expiresAt: now() + payload.data.expires_in * 1000
      }
      return cached.value
    })().finally(() => {
      inflight = undefined
    })
    return inflight
  }
}

export function toMinorUnits(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error('Invalid NOK amount')
  const [whole, decimal = ''] = value.split('.')
  const amount =
    Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  if (!Number.isSafeInteger(amount))
    throw new Error('NOK amount exceeds safe integer')
  return amount
}

export function createVippsShopifyOrders(
  config: VippsConfig,
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch
) {
  // A test Vipps payment may NEVER create a paid order in the production shop.
  const domain =
    config.environment === 'test' ?
      env.VIPPS_SHOPIFY_TEST_STORE_DOMAIN
    : env.STORE_DOMAIN
  if (
    !domain ||
    !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(domain)
  ) {
    throw new Error(
      'Vipps Shopify environment is not configured'
    )
  }
  if (
    config.environment === 'test' &&
    domain === env.STORE_DOMAIN
  ) {
    throw new Error(
      'Vipps test payments require a separate Shopify development store'
    )
  }
  const getAdminToken = createVippsShopifyAdminTokenProvider(
    config,
    domain,
    env,
    fetcher
  )
  async function graphql(
    query: string,
    variables: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await fetcher(
      `https://${domain}/admin/api/2026-04/graphql.json`,
      {
        method: 'POST',
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': await getAdminToken()
        },
        body: JSON.stringify({ query, variables })
      }
    )
    if (!response.ok)
      throw new Error(`Vipps Shopify HTTP ${response.status}`)
    const result = z
      .object({
        data: z.record(z.string(), z.unknown()).optional(),
        errors: z.array(z.unknown()).optional()
      })
      .safeParse(await response.json())
    if (
      !result.success ||
      result.data.errors?.length ||
      !result.data.data
    )
      throw new Error('Vipps Shopify request failed')
    return result.data.data
  }
  function resultDraft(value: unknown) {
    const result = z
      .object({
        draftOrder: draftSchema.nullable(),
        userErrors: z.array(z.unknown())
      })
      .safeParse(value)
    if (
      !result.success ||
      result.data.userErrors.length ||
      !result.data.draftOrder
    )
      throw new Error('Vipps Shopify draft failed')
    return result.data.draftOrder
  }
  async function read(id: string) {
    return draftSchema.parse(
      (await graphql(vippsShopifyQueries.read, { id }))
        .draftOrder
    )
  }
  const assertDraft = (
    draft: VippsDraft,
    reference: string,
    amount: number
  ) => {
    if (
      !draft.tags.includes(reference) ||
      toMinorUnits(
        draft.totalPriceSet.presentmentMoney.amount
      ) !== amount
    ) {
      throw new VippsPaymentInvariantError(
        'shopify_draft_identity_or_amount_mismatch'
      )
    }
  }
  return {
    async findAvailableVariant(handle: string, variantId: string) {
      const result = z
        .object({
          shop: z.object({ currencyCode: z.literal('NOK') }),
          product: z
            .object({
              handle: z.string(),
              variants: z.object({ nodes: z.array(variantSchema) })
            })
            .nullable()
        })
        .parse(
          await graphql(vippsShopifyQueries.productByHandle, {
            identifier: { handle }
          })
        )
      const variant = result.product?.variants.nodes.find(
        item => item.id === variantId
      )
      if (
        !variant ||
        (variant.inventoryPolicy === 'DENY' &&
          (variant.inventoryQuantity ?? 0) <= 0)
      )
        throw new Error('Variant unavailable for Vipps Express')
      return variant
    },
    read,
    async create(input: Record<string, unknown>) {
      return resultDraft(
        (await graphql(vippsShopifyQueries.create, { input }))
          .draftOrderCreate
      )
    },
    async update(id: string, input: Record<string, unknown>) {
      return resultDraft(
        (
          await graphql(vippsShopifyQueries.update, {
            id,
            input
          })
        ).draftOrderUpdate
      )
    },
    async prepare(
      id: string,
      reference: string,
      amount: number,
      payment: VippsPayment
    ) {
      const draft = await read(id)
      assertDraft(draft, reference, amount)
      if (draft.order) return
      const address = payment.shippingDetails?.address
      const user = payment.userDetails
      if (
        !address ||
        address.country !== 'NO' ||
        !user?.firstName ||
        !user.lastName ||
        !user.email ||
        !user.mobileNumber
      ) {
        throw new VippsPaymentInvariantError(
          'missing_vipps_delivery_identity'
        )
      }
      const updated = resultDraft(
        (
          await graphql(vippsShopifyQueries.update, {
            id,
            input: {
              email: user.email,
              phone: user.mobileNumber,
              shippingAddress: {
                firstName: user.firstName,
                lastName: user.lastName,
                address1: address.addressLine1,
                address2: address.addressLine2 ?? '',
                city: address.city,
                zip: address.postCode,
                countryCode: 'NO',
                phone: user.mobileNumber
              }
            }
          })
        ).draftOrderUpdate
      )
      // Address/tax/discount recalculation must never silently increase the amount after consent.
      assertDraft(updated, reference, amount)
    },
    async completePaid(
      id: string,
      reference: string,
      amount: number,
      payment: VippsPayment
    ) {
      assertPaymentIdentity(payment, reference, amount)
      if (!isFullyCaptured(payment, amount))
        throw new VippsPaymentInvariantError(
          'capture_not_verified'
        )
      let draft = await read(id)
      assertDraft(draft, reference, amount)
      if (!draft.order) {
        // No pending flag: the external capture has been verified BEFORE this operation.
        // After an ambiguous timeout, retry by reading this SAME draft ID, never creating another.
        await graphql(vippsShopifyQueries.complete, { id })
        draft = await read(id)
      }
      if (
        !draft.order ||
        draft.order.displayFinancialStatus !== 'PAID'
      )
        throw new Error('Shopify PAID readback missing')
      return { id: draft.order.id, name: draft.order.name }
    }
  }
}
