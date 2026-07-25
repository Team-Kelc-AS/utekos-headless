import { shopifyFetch } from '../../src/api/shopify/request/fetchShopify'
import type { ShopifyOperation } from '@types'
import { protos } from '@google-cloud/retail'
import { z } from 'zod'

const moneySchema = z.strictObject({
  amount: z.string().regex(/^\d+(?:\.\d+)?$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/)
})

const imageSchema = z
  .strictObject({
    altText: z.string().nullable(),
    url: z.string().url()
  })
  .nullable()

const selectedOptionSchema = z.strictObject({
  name: z.string().min(1),
  value: z.string().min(1)
})

const variantSchema = z.strictObject({
  availableForSale: z.boolean(),
  id: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),
  price: moneySchema,
  selectedOptions: z.array(selectedOptionSchema),
  sku: z.string(),
  title: z.string().min(1)
})

const productSchema = z.strictObject({
  availableForSale: z.boolean(),
  description: z.string(),
  featuredImage: imageSchema,
  handle: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  id: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/),
  onlineStoreUrl: z.string().url().nullable(),
  priceRange: z.strictObject({ minVariantPrice: moneySchema }),
  productType: z.string(),
  tags: z.array(z.string()),
  title: z.string().min(1),
  variants: z.strictObject({
    nodes: z.array(variantSchema),
    pageInfo: z.strictObject({ hasNextPage: z.boolean() })
  }),
  vendor: z.string()
})

const pageSchema = z.strictObject({
  products: z.strictObject({
    nodes: z.array(productSchema),
    pageInfo: z.strictObject({
      endCursor: z.string().nullable(),
      hasNextPage: z.boolean()
    })
  })
})

type RawProduct = z.infer<typeof productSchema>

type CatalogVariables = { after: string | null; first: number }

export type RetailCatalogSnapshot = {
  products: protos.google.cloud.retail.v2.IProduct[]
  primaryProductCount: number
  variantCount: number
}

export const retailCatalogProductsQuery = /* GraphQL */ `
  query RetailCatalogProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        description
        productType
        vendor
        tags
        availableForSale
        onlineStoreUrl
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 250) {
          pageInfo {
            hasNextPage
          }
          nodes {
            id
            sku
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`

function gidNumber(gid: string) {
  const value = gid.split('/').at(-1)

  if (!value || !/^\d+$/.test(value)) {
    throw new Error('retail_catalog_invalid_shopify_id')
  }

  return value
}

function availability(availableForSale: boolean) {
  return availableForSale ? 'IN_STOCK' : 'OUT_OF_STOCK'
}

function priceInfo(money: z.infer<typeof moneySchema>) {
  return {
    currencyCode: money.currencyCode,
    price: Number(money.amount)
  }
}

function cleanText(value: string, maximum: number) {
  return value.trim().slice(0, maximum)
}

function productUri(product: RawProduct) {
  return `https://utekos.no/produkter/${product.handle}`
}

function productCategory(product: RawProduct) {
  return cleanText(product.productType, 5_000) || 'Utekos'
}

function productImages(product: RawProduct) {
  return product.featuredImage ?
      [{ uri: product.featuredImage.url }]
    : []
}

function productTags(product: RawProduct) {
  return product.tags
    .map(tag => cleanText(tag, 1_000))
    .filter(Boolean)
    .slice(0, 100)
}

function buildPrimaryProduct(
  product: RawProduct
): protos.google.cloud.retail.v2.IProduct {
  const id = `shopify-product-${gidNumber(product.id)}`

  return {
    attributes: {
      shopify_handle: {
        indexable: true,
        searchable: true,
        text: [product.handle]
      }
    },
    availability: availability(product.availableForSale),
    brands: [cleanText(product.vendor, 1_000) || 'Utekos'],
    categories: [productCategory(product)],
    description: cleanText(product.description, 5_000),
    id,
    images: productImages(product),
    languageCode: 'nb-NO',
    priceInfo: priceInfo(product.priceRange.minVariantPrice),
    primaryProductId: id,
    tags: productTags(product),
    title: cleanText(product.title, 1_000),
    type: 'PRIMARY',
    uri: productUri(product)
  }
}

function buildVariantProduct(
  product: RawProduct,
  variant: RawProduct['variants']['nodes'][number]
): protos.google.cloud.retail.v2.IProduct {
  const primaryProductId = `shopify-product-${gidNumber(product.id)}`
  const selectedOptions = variant.selectedOptions.map(
    option => `${option.name}: ${option.value}`
  )
  const sizes = variant.selectedOptions
    .filter(option => /^(size|størrelse)$/i.test(option.name))
    .map(option => option.value)

  return {
    attributes: {
      selected_options: {
        indexable: true,
        searchable: true,
        text: selectedOptions
      },
      ...(variant.sku.trim() ?
        {
          shopify_sku: {
            indexable: true,
            searchable: true,
            text: [cleanText(variant.sku, 128)]
          }
        }
      : {})
    },
    availability: availability(variant.availableForSale),
    brands: [cleanText(product.vendor, 1_000) || 'Utekos'],
    id: `shopify-variant-${gidNumber(variant.id)}`,
    images: productImages(product),
    languageCode: 'nb-NO',
    priceInfo: priceInfo(variant.price),
    primaryProductId,
    sizes,
    title: cleanText(
      `${product.title} – ${variant.title}`,
      1_000
    ),
    type: 'VARIANT',
    uri: productUri(product)
  }
}

export function buildRetailCatalog(
  rawProducts: readonly unknown[]
): RetailCatalogSnapshot {
  const products = rawProducts.map(product =>
    productSchema.parse(product)
  )

  for (const product of products) {
    if (product.variants.pageInfo.hasNextPage) {
      throw new Error('retail_catalog_variant_page_incomplete')
    }
  }

  const retailProducts = products.flatMap(product => [
    buildPrimaryProduct(product),
    ...product.variants.nodes.map(variant =>
      buildVariantProduct(product, variant)
    )
  ])

  const ids = retailProducts.map(product => product.id)
  if (new Set(ids).size !== ids.length) {
    throw new Error('retail_catalog_duplicate_product_id')
  }

  return {
    primaryProductCount: products.length,
    products: retailProducts,
    variantCount: products.reduce(
      (total, product) => total + product.variants.nodes.length,
      0
    )
  }
}

export async function fetchShopifyRetailCatalog(): Promise<RetailCatalogSnapshot> {
  const products: RawProduct[] = []
  let after: string | null = null

  for (let page = 0; page < 100; page += 1) {
    const response = await shopifyFetch<
      ShopifyOperation<
        z.infer<typeof pageSchema>,
        CatalogVariables
      >
    >({
      query: retailCatalogProductsQuery,
      variables: { after, first: 100 }
    })

    if (!response.success) {
      throw new Error('retail_catalog_shopify_unavailable')
    }

    const parsed = pageSchema.safeParse(response.body)
    if (!parsed.success) {
      throw new Error('retail_catalog_shopify_invalid')
    }

    products.push(...parsed.data.products.nodes)

    if (!parsed.data.products.pageInfo.hasNextPage) {
      return buildRetailCatalog(products)
    }

    after = parsed.data.products.pageInfo.endCursor
    if (!after) {
      throw new Error('retail_catalog_shopify_invalid_cursor')
    }
  }

  throw new Error('retail_catalog_product_page_limit')
}
