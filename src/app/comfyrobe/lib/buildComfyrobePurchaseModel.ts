import 'server-only'

import { buildProductPurchaseModel } from '@/lib/shopify/buildProductPurchaseModel'
import type { ShopifyProduct } from 'types/product'
import type {
  ProductPurchaseModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type ComfyrobePurchaseSizeChoice = {
  value: string
  available: boolean
}

export type ComfyrobeVariantPresentation = {
  variantId: string
  color: string | null
  gender: string | null
  savings: {
    amount: ProductPurchaseVariant['price']
    percentage: number
  } | null
}

export type ComfyrobePurchaseModel = {
  product: ProductPurchaseModel
  initialVariantId: string | null
  sizeOption: {
    name: string
    choices: ComfyrobePurchaseSizeChoice[]
  } | null
  variantPresentation: ComfyrobeVariantPresentation[]
}

const COMFYROBE_LANDING_SIZE = 'XL'

function getSelectedOptionValue(
  variant: ProductPurchaseVariant,
  optionName: string
): string | null {
  return (
    variant.selectedOptions.find(
      option => option.name === optionName
    )?.value ?? null
  )
}

function formatComputedMoneyAmount(amount: number): string {
  return amount
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1')
}

function buildSavings(
  variant: ProductPurchaseVariant
): ComfyrobeVariantPresentation['savings'] {
  const price = Number(variant.price.amount)
  const compareAtPrice = Number(variant.compareAtPrice?.amount)

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(compareAtPrice) ||
    !variant.compareAtPrice ||
    variant.compareAtPrice.currencyCode !==
      variant.price.currencyCode ||
    compareAtPrice <= price
  ) {
    return null
  }

  return {
    amount: {
      amount: formatComputedMoneyAmount(compareAtPrice - price),
      currencyCode: variant.price.currencyCode
    },
    percentage: Math.round(
      ((compareAtPrice - price) / compareAtPrice) * 100
    )
  }
}

export function buildComfyrobePurchaseModel(
  product: ShopifyProduct
): ComfyrobePurchaseModel {
  const productModel = buildProductPurchaseModel(product)

  const sizeProductOption = productModel.options.find(
    option => option.name === 'Størrelse'
  )
  const xlVariant =
    sizeProductOption ?
      (productModel.variants.find(
        variant =>
          getSelectedOptionValue(
            variant,
            sizeProductOption.name
          ) === COMFYROBE_LANDING_SIZE
      ) ?? null)
    : null
  const initialVariantId = xlVariant?.id ?? null
  const sizeOption =
    sizeProductOption ?
      {
        name: sizeProductOption.name,
        choices: [
          {
            value: COMFYROBE_LANDING_SIZE,
            available: xlVariant?.availableForSale ?? false
          }
        ]
      }
    : null

  return {
    product: productModel,
    initialVariantId,
    sizeOption,
    variantPresentation: productModel.variants.map(variant => ({
      variantId: variant.id,
      color: getSelectedOptionValue(variant, 'Farge'),
      gender: getSelectedOptionValue(variant, 'Kjønn'),
      savings: buildSavings(variant)
    }))
  }
}
