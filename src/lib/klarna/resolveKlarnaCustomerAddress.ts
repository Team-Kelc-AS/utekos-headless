import type { KlarnaCollectedShippingAddress } from '@/components/klarna/schemas/klarnaExpressOrderSchema'

function pickNonEmpty(
  preferred: string | undefined,
  fallback: string | undefined
): string | undefined {
  const preferredValue = preferred?.trim()
  if (preferredValue) {
    return preferredValue
  }

  const fallbackValue = fallback?.trim()
  return fallbackValue || undefined
}

function mergeAddress(
  preferred: KlarnaCollectedShippingAddress | undefined,
  fallback: KlarnaCollectedShippingAddress | undefined
): KlarnaCollectedShippingAddress {
  return {
    given_name: pickNonEmpty(
      preferred?.given_name,
      fallback?.given_name
    ),
    family_name: pickNonEmpty(
      preferred?.family_name,
      fallback?.family_name
    ),
    email: pickNonEmpty(preferred?.email, fallback?.email),
    phone: pickNonEmpty(preferred?.phone, fallback?.phone),
    street_address: pickNonEmpty(
      preferred?.street_address,
      fallback?.street_address
    ),
    street_address2: pickNonEmpty(
      preferred?.street_address2,
      fallback?.street_address2
    ),
    postal_code: pickNonEmpty(
      preferred?.postal_code,
      fallback?.postal_code
    ),
    city: pickNonEmpty(preferred?.city, fallback?.city),
    region: pickNonEmpty(preferred?.region, fallback?.region),
    country: pickNonEmpty(preferred?.country, fallback?.country)
  }
}

export function resolveKlarnaCustomerAddress({
  collectedShippingAddress,
  shippingAddress,
  billingAddress
}: {
  collectedShippingAddress: KlarnaCollectedShippingAddress
  shippingAddress?: KlarnaCollectedShippingAddress
  billingAddress?: KlarnaCollectedShippingAddress
}): KlarnaCollectedShippingAddress {
  // Prefer Klarna Order Management addresses (authoritative after
  // create-order). Fall back field-by-field to Express SDK collection.
  const preferred =
    shippingAddress?.email || shippingAddress?.phone ?
      shippingAddress
    : billingAddress

  const secondary =
    preferred === shippingAddress ? billingAddress : shippingAddress

  const merged = mergeAddress(
    preferred,
    mergeAddress(secondary, collectedShippingAddress)
  )

  if (!merged.email) {
    throw new Error(
      'Klarna order is missing customer email required for Shopify'
    )
  }

  return merged
}
