import 'server-only'

import { getAdjacentAndFirstAvailableVariants } from '@shopify/hydrogen-react/getProductOptions'
import { mapShopifySelectItem } from '@/lib/analytics/shopifySelectItemCommerce'
import {
  buildPublicVariantUrl,
  requireProductPresentation,
  resolvePublicVariantOptions
} from '@/lib/products/presentation'
import { createUtekosProductOptions } from '@/lib/shopify/product-options/createUtekosProductOptions'
import type {
  StorefrontProductOptionVariant,
  StorefrontProductOptions
} from '@/api/shopify/types/storefrontProductOptions'
import type { CanonicalSelectItemCustomData } from '@/lib/analytics/selectItemEvent'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type SvaleSizeChoice = {
  available: boolean
  code: string
  href: string
  label: string
  tracking: Omit<CanonicalSelectItemCustomData, 'interaction_id'>
  variant: ProductPurchaseVariant
  variantId: string
}

export type SvaleSizeSelectorModel = {
  initialVariantId: string
  product: ProductCommerceModel
  choices: SvaleSizeChoice[]
}

function requireProductIdentity(
  product: StorefrontProductOptions
): ProductCommerceModel {
  if (!product.productType || !product.vendor) {
    throw new Error(
      'Shopify product-options response lacks commerce identity fields'
    )
  }

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    collections: product.collections
  }
}

function requirePurchaseVariant(
  variant: StorefrontProductOptionVariant
): ProductPurchaseVariant {
  if (
    !variant.title ||
    typeof variant.currentlyNotInStock !== 'boolean' ||
    typeof variant.taxable !== 'boolean' ||
    !variant.price ||
    variant.compareAtPrice === undefined ||
    variant.quantityAvailable === undefined ||
    variant.barcode === undefined ||
    variant.sku === undefined
  ) {
    throw new Error(
      `Shopify product-options variant lacks commerce fields: ${variant.id}`
    )
  }

  return {
    id: variant.id,
    title: variant.title,
    barcode: variant.barcode,
    availableForSale: variant.availableForSale,
    currentlyNotInStock: variant.currentlyNotInStock,
    taxable: variant.taxable,
    selectedOptions: variant.selectedOptions,
    price: variant.price,
    image: null,
    compareAtPrice: variant.compareAtPrice,
    ...(variant.sku ? { sku: variant.sku } : {}),
    quantityAvailable: variant.quantityAvailable
  }
}

export function createSvaleSizeSelectorModel(
  product: StorefrontProductOptions
): SvaleSizeSelectorModel {
  if (product.handle !== 'utekos-svale') {
    throw new Error(
      `Expected utekos-svale, received ${product.handle}`
    )
  }

  const presentation = requireProductPresentation(product.handle)
  const publicOptions = createUtekosProductOptions(product)
  const sizeOption = publicOptions.options.find(
    option => option.name === 'Størrelse'
  )

  if (!sizeOption) {
    throw new Error(
      'Shopify product-options response lacks Størrelse'
    )
  }

  const sourceVariants = [
    product.selectedOrFirstAvailableVariant,
    ...product.adjacentVariants,
    ...product.options.flatMap(option =>
      option.optionValues.flatMap(value =>
        value.firstSelectableVariant ?
          [value.firstSelectableVariant]
        : []
      )
    )
  ]
  const sourceById = new Map(
    sourceVariants.map(variant => [variant.id, variant])
  )
  const adjacentVariantIds =
    getAdjacentAndFirstAvailableVariants(product).map(
      variant => variant.id
    )
  const variantsById = new Map(
    adjacentVariantIds.flatMap(id => {
      const variant = sourceById.get(id)
      return variant ? [[id, variant] as const] : []
    })
  )
  const commerceProduct = requireProductIdentity(product)

  const choices = sizeOption.optionValues.flatMap(
    optionValue => {
      if (
        !optionValue.exists ||
        !optionValue.variantId ||
        optionValue.isDifferentProduct
      ) {
        return []
      }

      const sourceVariant = variantsById.get(
        optionValue.variantId
      )

      if (!sourceVariant) {
        throw new Error(
          `Missing adjacent Svale variant: ${optionValue.variantId}`
        )
      }

      const variant = requirePurchaseVariant(sourceVariant)
      const resolvedOptions = resolvePublicVariantOptions(
        presentation,
        sourceVariant.selectedOptions
      )

      if (!resolvedOptions) {
        throw new Error(
          `Missing public Svale option mapping: ${sourceVariant.id}`
        )
      }

      const href = buildPublicVariantUrl({
        presentation,
        options: resolvedOptions,
        path: '/produkter/svale'
      })
      const tracking = mapShopifySelectItem({
        product: commerceProduct,
        variant,
        interactionId: 'runtime-interaction-id',
        itemListId: 'svale-size-selector'
      })
      const { interaction_id: _interactionId, ...trackingData } =
        tracking

      return [
        {
          available: optionValue.variantAvailableForSale,
          code: optionValue.name,
          href,
          label: optionValue.name,
          tracking: trackingData,
          variant,
          variantId: optionValue.variantId
        }
      ]
    }
  )

  if (choices.length === 0) {
    throw new Error(
      'Shopify product-options response lacks Svale variants'
    )
  }

  return {
    initialVariantId: publicOptions.selectedVariantId,
    product: commerceProduct,
    choices
  }
}
