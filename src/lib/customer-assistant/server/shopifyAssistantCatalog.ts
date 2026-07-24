import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import type {
  Connection,
  ShopifyFetchResult,
  ShopifyOperation
} from '@types'
import type { AssistantProduct } from '../assistantProtocol'

type AssistantProductVariant =
  AssistantProduct['variants'][number]

type RawAssistantProduct = {
  id: string
  handle: string
  title: string
  featuredImage: { altText: string | null; url: string } | null
  priceRange: { minVariantPrice: AssistantProduct['price'] }
  variants: Connection<AssistantProductVariant>
}

type AssistantProductsOperation = ShopifyOperation<
  { products: Connection<RawAssistantProduct> },
  { first: number; query: string | undefined }
>

type AssistantCatalogFetch = (input: {
  headers?: HeadersInit
  query: string
  variables: AssistantProductsOperation['variables']
}) => Promise<
  ShopifyFetchResult<AssistantProductsOperation['data']>
>

const assistantProductsQuery = /* GraphQL */ `
  query assistantProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          handle
          title
          featuredImage {
            altText
            url
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`

export function normalizeAssistantProduct(
  product: RawAssistantProduct
): AssistantProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    href: `/produkter/${product.handle}`,
    image:
      product.featuredImage ?
        {
          alt: product.featuredImage.altText ?? '',
          url: product.featuredImage.url
        }
      : null,
    price: product.priceRange.minVariantPrice,
    variants: product.variants.edges.map(edge => edge.node)
  }
}

export async function fetchAssistantProducts(
  { buyerIp, handles }: { buyerIp?: string; handles?: string[] },
  fetchProducts: AssistantCatalogFetch = shopifyFetch
): Promise<AssistantProduct[]> {
  const query =
    handles?.length ?
      handles.map(handle => `handle:${handle}`).join(' OR ')
    : undefined

  const response = await fetchProducts({
    query: assistantProductsQuery,
    variables: { first: 20, query },
    ...(buyerIp ?
      { headers: { 'Shopify-Storefront-Buyer-IP': buyerIp } }
    : {})
  })

  if (!response.success) {
    throw new Error('shopify_assistant_catalog_unavailable')
  }

  return response.body.products.edges.map(({ node }) =>
    normalizeAssistantProduct(node)
  )
}
