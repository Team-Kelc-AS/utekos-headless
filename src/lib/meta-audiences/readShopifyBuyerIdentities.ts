import { z } from 'zod'
import { normalizeAudienceIdentity } from './normalizeAudienceIdentity'

export async function readShopifyBuyerIdentities(
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch
) {
  const domain = z
    .string()
    .regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/)
    .parse(env.STORE_DOMAIN)
  const token = z
    .string()
    .min(1)
    .parse(env.SHOPIFY_ADMIN_API_TOKEN)
  const schema = z.object({
    data: z.object({
      customers: z.object({
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable()
        }),
        nodes: z.array(
          z.object({
            id: z.string(),
            numberOfOrders: z.string().regex(/^\d+$/),
            defaultEmailAddress: z
              .object({ emailAddress: z.string() })
              .nullable(),
            defaultPhoneNumber: z
              .object({ phoneNumber: z.string() })
              .nullable(),
            defaultAddress: z
              .object({ phone: z.string().nullable() })
              .nullable(),
            amountSpent: z.object({
              amount: z.string(),
              currencyCode: z.string()
            }),
            updatedAt: z.string()
          })
        )
      })
    })
  })
  const rows: Array<{
    phone: string | null
    email: string | null
  }> = []
  let after: string | null = null,
    total = 0,
    pages = 0,
    buyerProfiles = 0
  const cursors = new Set<string>()
  do {
    const response = await fetcher(
      `https://${domain}/admin/api/2026-07/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query:
            'query AudienceBuyerSnapshot($after: String) { customers(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id numberOfOrders defaultEmailAddress { emailAddress } defaultPhoneNumber { phoneNumber } defaultAddress { phone } amountSpent { amount currencyCode } updatedAt } } }',
          variables: { after }
        }),
        signal: AbortSignal.timeout(30000)
      }
    )
    const body: unknown = await response.json()
    const result = schema.safeParse(body)
    if (
      !response.ok ||
      !result.success ||
      (body && typeof body === 'object' && 'errors' in body)
    )
      throw new Error(
        `Shopify buyer snapshot failed: HTTP ${response.status}; no partial buyer snapshot accepted`
      )
    const page = result.data.data.customers
    total += page.nodes.length
    for (const node of page.nodes)
      if (Number(node.numberOfOrders) > 0) {
        buyerProfiles++
        rows.push({
          phone: node.defaultPhoneNumber?.phoneNumber ?? null,
          email: node.defaultEmailAddress?.emailAddress ?? null
        })
        if (
          node.defaultAddress?.phone &&
          node.defaultAddress.phone !==
            node.defaultPhoneNumber?.phoneNumber
        )
          rows.push({
            phone: node.defaultAddress.phone,
            email: node.defaultEmailAddress?.emailAddress ?? null
          })
      }
    after =
      page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null
    if (page.pageInfo.hasNextPage && !after)
      throw new Error('Incomplete Shopify pagination')
    if (after && cursors.has(after))
      throw new Error('Repeated Shopify cursor')
    if (after) cursors.add(after)
    if (++pages > 100)
      throw new Error('Shopify read budget exceeded')
  } while (after)
  return {
    rows,
    total,
    buyerProfiles,
    uniqueUsableBuyerPhones: new Set(
      rows
        .map(row => normalizeAudienceIdentity(row).phone)
        .filter(Boolean)
    ).size,
    observedAt: new Date().toISOString(),
    completeness:
      'current_shopify_customer_profiles_only' as const
  }
}
