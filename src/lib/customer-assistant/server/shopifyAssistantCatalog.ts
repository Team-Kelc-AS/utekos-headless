import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type { ShopifyOperation } from '@types'
import { z } from 'zod'
import {
  assistantProductSchema,
  type AssistantProduct
} from '../assistantProtocol'

type AssistantProductVariant =
  AssistantProduct['variants'][number]

type RawAssistantProduct = {
  id: string
  handle: string
  title: string
  availableForSale: boolean
  featuredImage: { altText: string | null; url: string } | null
  priceRange: { minVariantPrice: AssistantProduct['price'] }
  variants: {
    edges: Array<{ node: AssistantProductVariant }>
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

type AssistantCatalogRequest = {
  query: string
  signal?: AbortSignal
  variables: Record<string, string | number>
}

type AssistantCatalogFetch = (
  input: AssistantCatalogRequest
) => Promise<unknown>

const assistantHandleSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const assistantCatalogInputSchema = z.strictObject({
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
  availableForSale: z.boolean(),
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
    pageInfo: z.object({
      hasNextPage: z.boolean(),
      endCursor: z.string().nullable()
    }),
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

const storefrontGatewayResultSchema = z.union([
  z.strictObject({
    success: z.literal(true),
    body: z.unknown()
  }),
  z.strictObject({
    success: z.literal(false),
    error: z.unknown()
  })
])

const DEFAULT_CATALOG_DEADLINE_MS = 8_000

const assistantProductFragment = /* GraphQL */ `
  fragment assistantProduct on Product {
    id
    handle
    title
    availableForSale
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
    variants(first: 250) {
      pageInfo {
        hasNextPage
        endCursor
      }
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
  const parsed = storefrontGatewayResultSchema.safeParse(response)

  if (!parsed.success || !parsed.data.success) {
    normalizeAssistantCatalogFailure()
  }

  return parsed.data.body
}

async function fetchShopifyAssistantCatalog(
  request: AssistantCatalogRequest
): Promise<unknown> {
  return storefrontGateway.catalogQuery<
    ShopifyOperation<
      unknown,
      AssistantCatalogRequest['variables']
    >
  >(request)
}

export function normalizeAssistantProduct(
  product: RawAssistantProduct
): AssistantProduct {
  if (product.variants.pageInfo.hasNextPage) {
    normalizeAssistantCatalogFailure()
  }

  return assistantProductSchema.parse({
    id: product.id,
    handle: product.handle,
    title: product.title,
    href: `/produkter/${product.handle}`,
    availableForSale: product.availableForSale,
    image:
      product.featuredImage ?
        {
          alt:
            product.featuredImage.altText?.trim() ||
            product.title,
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
  })
}

function createFetchAssistantProducts(
  fetchCatalog: AssistantCatalogFetch,
  options: { deadlineMs?: number } = {}
) {
  return async function fetchAssistantProductsWithCatalog(input: {
    handles?: string[]
  }): Promise<AssistantProduct[]> {
    const parsedInput =
      assistantCatalogInputSchema.safeParse(input)

    if (!parsedInput.success) {
      normalizeAssistantCatalogFailure()
    }

    const handles = [...new Set(parsedInput.data.handles ?? [])]
    const deadlineMs =
      options.deadlineMs ?? DEFAULT_CATALOG_DEADLINE_MS
    const signal = AbortSignal.timeout(deadlineMs)
    const request =
      handles.length ?
        {
          query: createAssistantProductsByHandleQuery(handles),
          signal,
          variables: Object.fromEntries(
            handles.map((handle, index) => [
              `handle${index}`,
              handle
            ])
          )
        }
      : {
          query: assistantProductsQuery,
          signal,
          variables: { first: 20 }
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
  handles?: string[]
}): Promise<AssistantProduct[]> {
  return fetchAssistantProductsFromShopify(input)
}

/** @internal Test seam; production callers use fetchAssistantProducts. */
export const __TEST_ONLY__ = { createFetchAssistantProducts }
