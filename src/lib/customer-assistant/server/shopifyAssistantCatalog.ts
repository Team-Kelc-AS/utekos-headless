import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import type { Connection, ShopifyOperation } from '@types'
import { z } from 'zod'
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

type AssistantCatalogRequest = {
  headers?: HeadersInit
  query: string
  variables: Record<string, string | number>
}

type AssistantCatalogFetch = (
  input: AssistantCatalogRequest
) => Promise<unknown>

const assistantHandleSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const assistantCatalogInputSchema = z.strictObject({
  buyerIp: z.string().min(1).max(45).optional(),
  handles: z.array(assistantHandleSchema).max(20).optional()
})

const selectedOptionSchema = z.object({
  name: z.string(),
  value: z.string()
})

const rawAssistantProductSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  featuredImage: z
    .object({ altText: z.string().nullable(), url: z.string() })
    .nullable(),
  priceRange: z.object({
    minVariantPrice: z.object({
      amount: z.string(),
      currencyCode: z.string()
    })
  }),
  variants: z.object({
    edges: z.array(
      z.object({
        node: z.object({
          id: z.string(),
          title: z.string(),
          availableForSale: z.boolean(),
          selectedOptions: z.array(selectedOptionSchema)
        })
      })
    )
  })
})

const assistantProductsBodySchema = z.strictObject({
  products: z.strictObject({
    edges: z.array(
      z.strictObject({ node: rawAssistantProductSchema })
    )
  })
})

const assistantProductByHandleBodySchema = z.record(
  z.string(),
  rawAssistantProductSchema.nullable()
)

const shopifyFetchResultSchema = z.union([
  z.strictObject({
    success: z.literal(true),
    body: z.unknown()
  }),
  z.strictObject({
    success: z.literal(false),
    error: z.unknown()
  })
])

const assistantProductFragment = /* GraphQL */ `
  fragment assistantProduct on Product {
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
`

const assistantProductsQuery = /* GraphQL */ `
  query assistantProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          ...assistantProduct
        }
      }
    }
  }
  ${assistantProductFragment}
`

function createAssistantProductsByHandleQuery(
  handles: string[]
) {
  const variables = handles
    .map((_, index) => `$handle${index}: String!`)
    .join(', ')
  const products = handles
    .map(
      (_, index) =>
        `product${index}: product(handle: $handle${index}) { ...assistantProduct }`
    )
    .join('\n')

  return /* GraphQL */ `
    query assistantProductsByHandle(${variables}) {
      ${products}
    }
    ${assistantProductFragment}
  `
}

function normalizeAssistantCatalogFailure(): never {
  throw new Error('shopify_assistant_catalog_unavailable')
}

function parseSuccessfulShopifyBody(response: unknown) {
  const parsed = shopifyFetchResultSchema.safeParse(response)

  if (!parsed.success || !parsed.data.success) {
    normalizeAssistantCatalogFailure()
  }

  return parsed.data.body
}

async function fetchShopifyAssistantCatalog(
  request: AssistantCatalogRequest
): Promise<unknown> {
  return shopifyFetch<
    ShopifyOperation<
      unknown,
      AssistantCatalogRequest['variables']
    >
  >(request)
}

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
    variants: product.variants.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      availableForSale: node.availableForSale,
      selectedOptions: node.selectedOptions.map(
        ({ name, value }) => ({ name, value })
      )
    }))
  }
}

function createFetchAssistantProducts(
  fetchCatalog: AssistantCatalogFetch
) {
  return async function fetchAssistantProductsWithCatalog(input: {
    buyerIp?: string
    handles?: string[]
  }): Promise<AssistantProduct[]> {
    const parsedInput =
      assistantCatalogInputSchema.safeParse(input)

    if (!parsedInput.success) {
      normalizeAssistantCatalogFailure()
    }

    const handles = [...new Set(parsedInput.data.handles ?? [])]
    const request =
      handles.length ?
        {
          query: createAssistantProductsByHandleQuery(handles),
          variables: Object.fromEntries(
            handles.map((handle, index) => [
              `handle${index}`,
              handle
            ])
          ),
          ...(parsedInput.data.buyerIp ?
            {
              headers: {
                'Shopify-Storefront-Buyer-IP':
                  parsedInput.data.buyerIp
              }
            }
          : {})
        }
      : {
          query: assistantProductsQuery,
          variables: { first: 20 },
          ...(parsedInput.data.buyerIp ?
            {
              headers: {
                'Shopify-Storefront-Buyer-IP':
                  parsedInput.data.buyerIp
              }
            }
          : {})
        }

    try {
      const body = parseSuccessfulShopifyBody(
        await fetchCatalog(request)
      )

      if (handles.length) {
        const products =
          assistantProductByHandleBodySchema.safeParse(body)

        if (!products.success) {
          normalizeAssistantCatalogFailure()
        }

        return handles.flatMap((_, index) => {
          const product = products.data[`product${index}`]
          return product ?
              [normalizeAssistantProduct(product)]
            : []
        })
      }

      const products =
        assistantProductsBodySchema.safeParse(body)

      if (!products.success) {
        normalizeAssistantCatalogFailure()
      }

      return products.data.products.edges.map(({ node }) =>
        normalizeAssistantProduct(node)
      )
    } catch {
      normalizeAssistantCatalogFailure()
    }
  }
}

const fetchAssistantProductsFromShopify =
  createFetchAssistantProducts(fetchShopifyAssistantCatalog)

export function fetchAssistantProducts(input: {
  buyerIp?: string
  handles?: string[]
}): Promise<AssistantProduct[]> {
  return fetchAssistantProductsFromShopify(input)
}

/** @internal Test seam; production callers use fetchAssistantProducts. */
export const __TEST_ONLY__ = { createFetchAssistantProducts }
