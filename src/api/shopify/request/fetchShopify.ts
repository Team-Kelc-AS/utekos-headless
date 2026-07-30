// Path: src/api/shopify/request/fetchShopify.ts

import { isGraphQLErrorResponse } from '@/api/graphql/response/isGraphQLErrorResponse'
import { isGraphQLSuccessResponse } from '@/api/graphql/response/isGraphQLSuccessResponse'
import {
  getShopifyEndpoint,
  getShopifyToken
} from '@/db/config/shopify.config'
import type {
  ExtractVariables,
  ShopifyFetchResult,
  ShopifyOperation
} from '@types'
import { getRedactedErrorSummary } from '@/lib/cart/getRedactedErrorSummary'
import { redactShopifyCartSecrets } from '@/lib/cart/redactShopifyCartSecrets'

export async function shopifyFetch<
  T extends ShopifyOperation<unknown, object>
>({
  headers,
  cache,
  query,
  signal,
  variables
}: {
  headers?: HeadersInit
  cache?: RequestCache
  query: string
  signal?: AbortSignal
  variables?: ExtractVariables<T>
}): Promise<ShopifyFetchResult<T['data']>> {
  const endpoint = getShopifyEndpoint()
  const token = getShopifyToken()

  if (!token) {
    throw new Error('Missing Shopify storefront access token.')
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      ...(cache ? { cache } : {}),
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
        ...headers
      },
      ...(signal ? { signal } : {}),
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables })
      })
    })

    const body: unknown = await response.json()

    if (isGraphQLSuccessResponse<T['data']>(body)) {
      return { success: true, body: body.data }
    }

    if (isGraphQLErrorResponse(body)) {
      console.error(
        'Shopify API Error:',
        redactShopifyCartSecrets(JSON.stringify(body.errors))
      )
      return { success: false, error: body }
    }

    throw new Error(
      'Unknown response structure from Shopify API.'
    )
  } catch (e) {
    console.error(
      'Fetch operation failed:',
      getRedactedErrorSummary(e)
    )
    throw e
  }
}
