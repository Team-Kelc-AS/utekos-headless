import { z } from 'zod'

const enabledConfigSchema = z.strictObject({
  cutoverAt: z.string().datetime({ offset: true }),
  enabled: z.literal(true)
})

export type ShopifyAddPaymentInfoCanonicalConfig =
  | { enabled: false }
  | z.infer<typeof enabledConfigSchema>

export function readShopifyAddPaymentInfoCanonicalConfig(
  environment: Readonly<Record<string, string | undefined>>
): ShopifyAddPaymentInfoCanonicalConfig {
  if (
    environment.SHOPIFY_ADD_PAYMENT_INFO_CANONICAL_ENABLED !==
    'true'
  ) {
    return { enabled: false }
  }

  return enabledConfigSchema.parse({
    cutoverAt:
      environment.SHOPIFY_ADD_PAYMENT_INFO_CUTOVER_AT,
    enabled: true
  })
}
