import 'server-only'

import { buildProductPurchaseModel } from '@/lib/shopify/buildProductPurchaseModel'
import { buildProductCommerceViewModel } from './buildProductCommerceViewModel'
import type { ProductPurchaseModel } from 'types/product/ProductPurchaseModel'
import type { ShopifyProduct } from 'types/product'

export function buildPresentedProductPurchaseModel(
  product: ShopifyProduct,
  publicHandle: string
): ProductPurchaseModel {
  const rawPurchaseModel = buildProductPurchaseModel(product)
  const commerceModel = buildProductCommerceViewModel(
    product,
    publicHandle
  )
  const publicVariantsById = new Map(
    commerceModel.variants.map(variant => [
      variant.commerce.id,
      variant.commerce
    ])
  )

  return {
    ...rawPurchaseModel,
    title: commerceModel.displayName,
    handle: commerceModel.publicHandle,
    productType: commerceModel.category,
    vendor: 'Utekos',
    featuredImage: commerceModel.product.featuredImage,
    options: commerceModel.variants.reduce<
      ProductPurchaseModel['options']
    >((options, variant) => {
      for (const selectedOption of variant.commerce.selectedOptions) {
        let option = options.find(
          candidate => candidate.name === selectedOption.name
        )

        if (!option) {
          option = {
            name: selectedOption.name,
            optionValues: []
          }
          options.push(option)
        }

        if (
          !option.optionValues.some(
            value => value.name === selectedOption.value
          )
        ) {
          option.optionValues.push({ name: selectedOption.value })
        }
      }

      return options
    }, []),
    variants: rawPurchaseModel.variants.flatMap(variant => {
      const publicVariant = publicVariantsById.get(variant.id)

      if (!publicVariant) return []

      return [
        {
          ...variant,
          title: publicVariant.title,
          selectedOptions: publicVariant.selectedOptions,
          image: publicVariant.image ?? variant.image
        }
      ]
    })
  }
}
