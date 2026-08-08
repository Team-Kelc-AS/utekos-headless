// Path: src/api/shopify/request/fetchShopify.ts

import { isGraphQLErrorResponse } from '@/api/graphql/response/isGraphQLErrorResponse'
import { isGraphQLSuccessResponse } from '@/api/graphql/response/isGraphQLSuccessResponse'
import {
  getShopifyEndpoint,
  getShopifyToken,
  SHOPIFY_STOREFRONT_API_VERSION
} from '@/db/config/shopify.config'
import type {
  ExtractVariables,
  ShopifyFetchResult,
  ShopifyOperation
} from '@types'
import { getRedactedErrorSummary } from '@/lib/cart/getRedactedErrorSummary'
import { redactShopifyCartSecrets } from '@/lib/cart/redactShopifyCartSecrets'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import {
  classifyShopifyFetchError,
  DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS,
  getShopifyGraphQLErrorMetadata,
  getShopifyOperationMetadata,
  SLOW_SHOPIFY_STOREFRONT_REQUEST_MS
} from './shopifyRequestObservability'

type ShopifyFetchInput<
  T extends ShopifyOperation<
    unknown,
    object
  >
> = {
  headers?: HeadersInit
  cache?: RequestCache
  query: string
  signal?: AbortSignal
  timeoutMs?: number
  variables?: ExtractVariables<T>
}

type ShopifyRequestLogContext = {
  operationName: string
  operationType: string
  cacheMode: string
  timeoutMs: number
  durationMs: number
  responseHeadersMs?: number
  responseBodyMs?: number
  status?: number
  requestId?: string
  errorType?: string
  graphqlErrorCode?: string
}

function elapsedMilliseconds(
  startedAt: number
): number {
  return Math.max(
    0,
    Math.round(
      performance.now() - startedAt
    )
  )
}

function normalizeRequestId(
  value: string | null
): string | undefined {
  const normalized = value?.trim()

  return normalized || undefined
}

function createRequestLogContext(
  input: ShopifyRequestLogContext
) {
  return {
    operationName:
      input.operationName,
    operationType:
      input.operationType,
    cacheMode:
      input.cacheMode,
    timeoutMs:
      input.timeoutMs,
    durationMs:
      input.durationMs,
    responseHeadersMs:
      input.responseHeadersMs ??
      null,
    responseBodyMs:
      input.responseBodyMs ??
      null,
    status:
      input.status ??
      null,
    requestId:
      input.requestId ??
      null,
    errorType:
      input.errorType ??
      null,
    graphqlErrorCode:
      input.graphqlErrorCode ??
      null,
    runtime:
      getVercelRuntimeContext()
  }
}

function logSlowShopifyRequest(
  context: ShopifyRequestLogContext
) {
  console.warn(
    JSON.stringify({
      event:
        'shopify.storefront.slow_request',
      level: 'WARN',
      context:
        createRequestLogContext(
          context
        )
    })
  )
}

function logShopifyGraphQLError(
  error: string,
  context: ShopifyRequestLogContext
) {
  console.error(
    JSON.stringify({
      event:
        'shopify.storefront.graphql_error',
      level: 'ERROR',
      error,
      context:
        createRequestLogContext(
          context
        )
    })
  )
}

function logShopifyRequestFailure(
  error: unknown,
  context: ShopifyRequestLogContext
) {
  console.error(
    JSON.stringify({
      event:
        'shopify.storefront.request_failed',
      level: 'ERROR',
      error:
        getRedactedErrorSummary(
          error
        ),
      context:
        createRequestLogContext(
          context
        )
    })
  )
}

export async function shopifyFetch<
  T extends ShopifyOperation<
    unknown,
    object
  >
>({
  headers,
  cache,
  query,
  signal,
  timeoutMs,
  variables
}: ShopifyFetchInput<T>): Promise<
  ShopifyFetchResult<T['data']>
> {
  const endpoint =
    getShopifyEndpoint()

  const token =
    getShopifyToken()

  if (!token) {
    throw new Error(
      'Missing Shopify storefront access token.'
    )
  }

  const operation =
    getShopifyOperationMetadata(
      query
    )

  const endpointUrl =
    new URL(endpoint)

  const cacheMode =
    cache ?? 'default'

  const resolvedTimeoutMs =
    timeoutMs ??
    DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS

  if (
    !Number.isFinite(
      resolvedTimeoutMs
    ) ||
    resolvedTimeoutMs <= 0
  ) {
    throw new Error(
      'Shopify Storefront timeout must be greater than 0 ms.'
    )
  }

  const timeoutSignal =
    AbortSignal.timeout(
      resolvedTimeoutMs
    )

  const requestSignal =
    signal ?
      AbortSignal.any([
        signal,
        timeoutSignal
      ])
    : timeoutSignal

  return startAnalyticsSpan(
    {
      name:
        `Shopify Storefront ${operation.name}`,
      op: 'rpc.client',
      attributes: {
        'graphql.operation.name':
          operation.name,
        'graphql.operation.type':
          operation.type,
        'http.request.method':
          'POST',
        'server.address':
          endpointUrl.hostname,
        'shopify.api':
          'storefront',
        'shopify.api.version':
          SHOPIFY_STOREFRONT_API_VERSION,
        'shopify.fetch.cache_mode':
          cacheMode,
        'shopify.timeout_ms':
          resolvedTimeoutMs,
        'shopify.has_caller_signal':
          Boolean(signal)
      }
    },
    async span => {
      const startedAt =
        performance.now()

      let responseHeadersMs:
        | number
        | undefined

      let responseBodyMs:
        | number
        | undefined

      let status:
        | number
        | undefined

      let requestId:
        | string
        | undefined

      try {
        const response =
          await fetch(
            endpoint,
            {
              method: 'POST',
              ...(cache ?
                { cache }
              : {}),
              headers: {
                'Content-Type':
                  'application/json',
                'X-Shopify-Storefront-Access-Token':
                  token,
                ...headers
              },
              signal:
                requestSignal,
              body:
                JSON.stringify({
                  ...(query ?
                    { query }
                  : {}),
                  ...(variables ?
                    { variables }
                  : {})
                })
            }
          )

        status =
          response.status

        responseHeadersMs =
          elapsedMilliseconds(
            startedAt
          )

        requestId =
          normalizeRequestId(
            response.headers.get(
              'x-request-id'
            )
          )

        span.setAttribute(
          'http.response.status_code',
          status
        )

        span.setAttribute(
          'shopify.response_headers_ms',
          responseHeadersMs
        )

        if (requestId) {
          span.setAttribute(
            'shopify.request_id',
            requestId
          )
        }

        const bodyStartedAt =
          performance.now()

        const body: unknown =
          await response.json()

        responseBodyMs =
          elapsedMilliseconds(
            bodyStartedAt
          )

        const durationMs =
          elapsedMilliseconds(
            startedAt
          )

        span.setAttribute(
          'shopify.response_body_ms',
          responseBodyMs
        )

        span.setAttribute(
          'shopify.duration_ms',
          durationMs
        )

        if (
          isGraphQLSuccessResponse<
            T['data']
          >(body)
        ) {
          if (!response.ok) {
            span.setAttribute(
              'error.type',
              String(status)
            )
          }

          if (
            durationMs >=
            SLOW_SHOPIFY_STOREFRONT_REQUEST_MS
          ) {
            logSlowShopifyRequest({
              operationName:
                operation.name,
              operationType:
                operation.type,
              cacheMode,
              timeoutMs:
                resolvedTimeoutMs,
              durationMs,
              responseHeadersMs,
              responseBodyMs,
              status,
              ...(requestId ?
                { requestId }
              : {})
            })
          }

          return {
            success: true,
            body: body.data
          }
        }

        if (
          isGraphQLErrorResponse(
            body
          )
        ) {
          const graphqlError =
            getShopifyGraphQLErrorMetadata(
              body
            )

          requestId ??=
            graphqlError.requestId

          const errorType =
            graphqlError.code ??
            'graphql_error'

          span.setAttribute(
            'error.type',
            errorType
          )

          span.setAttribute(
            'shopify.graphql.error_count',
            body.errors.length
          )

          if (
            graphqlError.code
          ) {
            span.setAttribute(
              'shopify.graphql.error_code',
              graphqlError.code
            )
          }

          if (requestId) {
            span.setAttribute(
              'shopify.request_id',
              requestId
            )
          }

          logShopifyGraphQLError(
            redactShopifyCartSecrets(
              JSON.stringify(
                body.errors
              )
            ),
            {
              operationName:
                operation.name,
              operationType:
                operation.type,
              cacheMode,
              timeoutMs:
                resolvedTimeoutMs,
              durationMs,
              responseHeadersMs,
              responseBodyMs,
              status,
              errorType,
              ...(graphqlError.code ?
                {
                  graphqlErrorCode:
                    graphqlError.code
                }
              : {}),
              ...(requestId ?
                { requestId }
              : {})
            }
          )

          return {
            success: false,
            error: body
          }
        }

        throw new Error(
          'Unknown response structure from Shopify API.'
        )
      } catch (error) {
        const durationMs =
          elapsedMilliseconds(
            startedAt
          )

        const errorType =
          classifyShopifyFetchError({
            error,
            timeoutSignal,
            ...(signal ?
              {
                callerSignal:
                  signal
              }
            : {})
          })

        span.setAttribute(
          'error.type',
          errorType
        )

        span.setAttribute(
          'shopify.duration_ms',
          durationMs
        )

        if (
          responseHeadersMs !==
          undefined
        ) {
          span.setAttribute(
            'shopify.response_headers_ms',
            responseHeadersMs
          )
        }

        if (
          responseBodyMs !==
          undefined
        ) {
          span.setAttribute(
            'shopify.response_body_ms',
            responseBodyMs
          )
        }

        if (
          status !== undefined
        ) {
          span.setAttribute(
            'http.response.status_code',
            status
          )
        }

        if (requestId) {
          span.setAttribute(
            'shopify.request_id',
            requestId
          )
        }

        logShopifyRequestFailure(
          error,
          {
            operationName:
              operation.name,
            operationType:
              operation.type,
            cacheMode,
            timeoutMs:
              resolvedTimeoutMs,
            durationMs,
            ...(responseHeadersMs !==
            undefined ?
              {
                responseHeadersMs
              }
            : {}),
            ...(responseBodyMs !==
            undefined ?
              {
                responseBodyMs
              }
            : {}),
            ...(status !== undefined ?
              { status }
            : {}),
            errorType,
            ...(requestId ?
              { requestId }
            : {})
          }
        )

        throw error
      }
    }
  )
}