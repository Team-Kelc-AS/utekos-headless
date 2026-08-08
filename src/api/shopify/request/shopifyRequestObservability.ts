import type {
    GraphQLErrorResponse
  } from 'types/graphql.types'
  
  export const DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS =
    8_000
  
  export const SLOW_SHOPIFY_STOREFRONT_REQUEST_MS =
    1_000
  
  export type ShopifyGraphQLOperationType =
    | 'query'
    | 'mutation'
    | 'subscription'
  
  export type ShopifyGraphQLOperationMetadata = {
    name: string
    type: ShopifyGraphQLOperationType
  }
  
  export type ShopifyGraphQLErrorMetadata = {
    code?: string
    requestId?: string
  }
  
  const namedOperationPattern =
    /\b(query|mutation|subscription)\s+([_A-Za-z][_0-9A-Za-z]*)\b/
  
  const operationTypePattern =
    /\b(query|mutation|subscription)\b/
  
  const requestIdInMessagePattern =
    /Request ID:\s*([A-Za-z0-9-]+)/i
  
  function nonEmptyString(
    value: unknown
  ): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
  
    const normalized = value.trim()
  
    return normalized || undefined
  }
  
  export function getShopifyOperationMetadata(
    query: string
  ): ShopifyGraphQLOperationMetadata {
    const withoutComments =
      query.replace(/#[^\r\n]*/g, ' ')
  
    const namedMatch =
      namedOperationPattern.exec(
        withoutComments
      )
  
    if (namedMatch) {
      return {
        type:
          namedMatch[1] as
            ShopifyGraphQLOperationType,
        name: namedMatch[2]
      }
    }
  
    const operationTypeMatch =
      operationTypePattern.exec(
        withoutComments
      )
  
    return {
      type:
        operationTypeMatch ?
          operationTypeMatch[1] as
            ShopifyGraphQLOperationType
        : 'query',
      name: 'anonymous'
    }
  }
  
  export function getShopifyGraphQLErrorMetadata(
    response: GraphQLErrorResponse
  ): ShopifyGraphQLErrorMetadata {
    const firstError =
      response.errors[0]
  
    if (!firstError) {
      return {}
    }
  
    const code =
      nonEmptyString(
        firstError.extensions?.code
      )
  
    const extensionRequestId =
      nonEmptyString(
        firstError.extensions?.requestId
      )
  
    const messageRequestId =
      firstError.message.match(
        requestIdInMessagePattern
      )?.[1]
  
    const requestId =
      extensionRequestId ??
      nonEmptyString(messageRequestId)
  
    return {
      ...(code ? { code } : {}),
      ...(requestId ?
        { requestId }
      : {})
    }
  }
  
  export function classifyShopifyFetchError({
    error,
    timeoutSignal,
    callerSignal
  }: {
    error: unknown
    timeoutSignal: AbortSignal
    callerSignal?: AbortSignal
  }): string {
    if (timeoutSignal.aborted) {
      return 'timeout'
    }
  
    if (callerSignal?.aborted) {
      return 'aborted'
    }
  
    if (
      error instanceof Error &&
      error.name.trim()
    ) {
      return error.name
    }
  
    return 'unknown'
  }