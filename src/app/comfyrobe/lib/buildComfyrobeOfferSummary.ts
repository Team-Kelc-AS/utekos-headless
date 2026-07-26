import { getKlarnaMinorUnitAmount } from '@/components/klarna/utils/getKlarnaMinorUnitAmount'
import type { Money } from 'types/commerce/Money'

type ComfyrobeOfferVariantSource = {
  availableForSale: boolean
  price: Money
  compareAtPrice: Money | null
}

type ComfyrobeOfferProductSource = {
  selectedOrFirstAvailableVariant?: ComfyrobeOfferVariantSource | null
  variants: {
    edges: Array<{ node: ComfyrobeOfferVariantSource }>
  }
}

export type ComfyrobeOfferSummary = {
  availableForSale: boolean
  availabilityLabel: 'På lager' | 'Midlertidig utsolgt'
  price: Money
  priceLabel: string
  compareAtPriceLabel: string | null
  savingsAmountLabel: string | null
  savingsPercentage: number | null
  klarnaPurchaseAmount: string
}

export function formatComfyrobeMoney(money: Money) {
  const amount = Number(money.amount)
  if (!Number.isFinite(amount)) return ''

  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: money.currencyCode,
    maximumFractionDigits: 0
  }).format(amount)
}

export function buildComfyrobeOfferSummary(
  product: ComfyrobeOfferProductSource | null
): ComfyrobeOfferSummary | null {
  if (!product) return null

  const variants = product.variants.edges.map(edge => edge.node)
  const variant =
    variants.find(item => item.availableForSale) ??
    variants[0] ??
    product.selectedOrFirstAvailableVariant ??
    null

  if (!variant) return null

  const priceAmount = Number(variant.price.amount)
  if (!Number.isFinite(priceAmount) || priceAmount < 0)
    return null

  const compareAtAmount = Number(variant.compareAtPrice?.amount)
  const hasValidCompareAtPrice =
    variant.compareAtPrice !== null &&
    variant.compareAtPrice.currencyCode ===
      variant.price.currencyCode &&
    Number.isFinite(compareAtAmount) &&
    compareAtAmount > priceAmount
  const savingsAmount =
    hasValidCompareAtPrice ? compareAtAmount - priceAmount : null

  return {
    availableForSale: variant.availableForSale,
    availabilityLabel:
      variant.availableForSale ? 'På lager' : (
        'Midlertidig utsolgt'
      ),
    price: variant.price,
    priceLabel: formatComfyrobeMoney(variant.price),
    compareAtPriceLabel:
      hasValidCompareAtPrice && variant.compareAtPrice ?
        formatComfyrobeMoney(variant.compareAtPrice)
      : null,
    savingsAmountLabel:
      savingsAmount !== null ?
        formatComfyrobeMoney({
          amount: String(savingsAmount),
          currencyCode: variant.price.currencyCode
        })
      : null,
    savingsPercentage:
      savingsAmount !== null ?
        Math.round((savingsAmount / compareAtAmount) * 100)
      : null,
    klarnaPurchaseAmount:
      getKlarnaMinorUnitAmount(variant.price) ?? ''
  }
}
