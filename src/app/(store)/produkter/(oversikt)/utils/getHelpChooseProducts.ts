import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { TAGS } from '@/api/constants'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { Connection, ShopifyOperation } from '@types'
import type { Money } from 'types/commerce/Money'
import type { Image } from 'types/media'
import type { ProductOption, SelectedOption } from 'types/product/ProductTypes'
import type { ShopifyProduct, ShopifyProductVariant } from 'types/product'

type HelpChooseImage = {
  url: string
  altText: string | null
  width?: number | null
  height?: number | null
}

type RawHelpChooseVariant = {
  id: string
  title: string
  currentlyNotInStock: boolean
  selectedOptions: SelectedOption[]
  availableForSale: boolean
  taxable: boolean
  price: Money
  compareAtPrice: Money | null
  image: HelpChooseImage | null
  quantityAvailable: number | null
  sku: string | null
  barcode: string | null
  weight: number | null
}

type RawHelpChooseProduct = {
  id: string
  title: string
  handle: string
  productType: string
  vendor: string
  tags: string[]
  totalInventory: number
  updatedAt: string
  availableForSale: boolean
  featuredImage: Image | null
  compareAtPriceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  priceRange: {
    minVariantPrice: Money
    maxVariantPrice: Money
  }
  options: ProductOption[]
  variants: Connection<RawHelpChooseVariant>
  seo: {
    title: string | null
    description: string | null
  }
}

type HelpChooseProductsOperation = ShopifyOperation<
  Record<string, RawHelpChooseProduct | null>,
  Record<string, string>
>

const helpChooseProductFields = /* GraphQL */ `
  fragment helpChooseProductFields on Product {
          id
          title
          handle
          productType
          vendor
          tags
          totalInventory
          updatedAt
          availableForSale
          featuredImage {
            id
            url
            altText
            width
            height
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          options {
            name
            optionValues {
              name
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                currentlyNotInStock
                selectedOptions {
                  name
                  value
                }
                availableForSale
                taxable
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                  width
                  height
                }
                quantityAvailable
                sku
                barcode
                weight
              }
            }
          }
  seo {
    title
    description
  }
}
`

const helpChooseProductsQuery = /* GraphQL */ `
  query helpChooseProducts(
    $svale: String!
    $techdown: String!
    $dun: String!
    $mikrofiber: String!
    $comfyrobe: String!
  ) {
    svale: product(handle: $svale) {
      ...helpChooseProductFields
    }
    techdown: product(handle: $techdown) {
      ...helpChooseProductFields
    }
    dun: product(handle: $dun) {
      ...helpChooseProductFields
    }
    mikrofiber: product(handle: $mikrofiber) {
      ...helpChooseProductFields
    }
    comfyrobe: product(handle: $comfyrobe) {
      ...helpChooseProductFields
    }
  }
  ${helpChooseProductFields}
`

function normalizeVariantImage(image: HelpChooseImage | null): Image | null {
  if (!image) return null

  return {
    id: image.url,
    url: image.url,
    altText: image.altText ?? '',
    width: image.width ?? 0,
    height: image.height ?? 0
  }
}

function normalizeHelpChooseVariant(variant: RawHelpChooseVariant): ShopifyProductVariant {
  return {
    ...variant,
    sku: variant.sku ?? undefined,
    barcode: variant.barcode,
    image: normalizeVariantImage(variant.image),
    metafield: null,
    variantProfile: null,
    weightUnit: 'GRAMS'
  } as ShopifyProductVariant
}

function normalizeHelpChooseProduct(product: RawHelpChooseProduct): ShopifyProduct {
  const variants = {
    edges: product.variants.edges.map(edge => ({
      node: normalizeHelpChooseVariant(edge.node)
    }))
  }
  const selectedOrFirstAvailableVariant =
    variants.edges.find(edge => edge.node.availableForSale)?.node
    ?? variants.edges[0]?.node

  return {
    ...product,
    variants,
    selectedOrFirstAvailableVariant,
    images: { edges: [] },
    collections: { nodes: [] },
    description: '',
    relatedProducts: [],
    category: {
      id: '',
      name: '',
      ancestors: {
        id: '',
        name: '',
        ancestors: ''
      }
    },
    weight: {
      unit: 'GRAMS',
      value: 0
    }
  } as ShopifyProduct
}

export async function getHelpChooseProducts() {
  'use cache'

  cacheTag(TAGS.products)
  cacheLife('collections')

  const response = await storefrontGateway.catalogQuery<HelpChooseProductsOperation>({
    query: helpChooseProductsQuery,
    variables: {
      svale: 'utekos-svale',
      techdown: 'utekos-techdown',
      dun: 'utekos-dun',
      mikrofiber: 'utekos-mikrofiber',
      comfyrobe: 'comfyrobe'
    }
  })

  if (!response.success) {
    return []
  }

  return Object.values(response.body).flatMap(product =>
    product ? [normalizeHelpChooseProduct(product)] : []
  )
}
