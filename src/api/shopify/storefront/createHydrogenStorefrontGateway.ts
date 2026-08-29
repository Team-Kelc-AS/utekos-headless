import { isGraphQLErrorResponse } from '@/api/graphql/response/isGraphQLErrorResponse'
import { isGraphQLSuccessResponse } from '@/api/graphql/response/isGraphQLSuccessResponse'
import { createStorefrontClient } from '@shopify/hydrogen-react/storefront-client'
import type {
  ExtractVariables,
  ShopifyOperation
} from '@types'
import { getRedactedErrorSummary } from '@/lib/cart/getRedactedErrorSummary'
import { redactShopifyCartSecrets } from '@/lib/cart/redactShopifyCartSecrets'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import { cancelResponseBody } from '../request/cancelResponseBody'
import { createShopifyRequestDeadline } from '../request/createShopifyRequestDeadline'
import { readJsonWithDeadline } from '../request/readJsonWithDeadline'
import {
  classifyShopifyRequestError,
  DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS,
  getShopifyGraphQLErrorMetadata,
  getShopifyOperationMetadata,
  SLOW_SHOPIFY_STOREFRONT_REQUEST_MS
} from '../request/shopifyRequestObservability'
import type {
  StorefrontBuyerContext,
  StorefrontGateway,
  StorefrontGatewayResult
} from './StorefrontGatewayContract'

type StorefrontRequestKind =
  | 'catalog'
  | 'buyer'
  | 'mutation'

type StorefrontAuthMode =
  | 'public'
  | 'private'
  | 'public_fallback'

export type HydrogenStorefrontGatewayConfig = Readonly<{
  storeDomain: string
  publicStorefrontToken?: string
  privateStorefrontToken?: string
  storefrontApiVersion: string
}>

type HydrogenStorefrontGatewayDependencies = Readonly<{
  fetch: typeof fetch
}>

type StorefrontTransportInput<
  T extends ShopifyOperation<
    unknown,
    object
  >
> = {
  authMode: StorefrontAuthMode
  buyerIpPresent: boolean
  cache?: RequestCache
  endpoint: string
  fetchImpl: typeof fetch
  headers: Record<string, string>
  query: string
  requestKind: StorefrontRequestKind
  signal?: AbortSignal
  storefrontApiVersion: string
  timeoutMs?: number
  variables?: ExtractVariables<T>
}
type ShopifyRequestLogContext = {
  authMode: StorefrontAuthMode
  buyerIpPresent: boolean
  operationName: string
  operationType: string
  requestKind: StorefrontRequestKind
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
    authMode:
      input.authMode,
    buyerIpPresent:
      input.buyerIpPresent,
    operationName:
      input.operationName,
    operationType:
      input.operationType,
    requestKind:
      input.requestKind,
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

async function executeStorefrontRequest<
  T extends ShopifyOperation<
    unknown,
    object
  >
>({
  authMode,
  buyerIpPresent,
  headers,
  cache,
  endpoint,
  fetchImpl,
  query,
  requestKind,
  signal,
  storefrontApiVersion,
  timeoutMs,
  variables
}: StorefrontTransportInput<T>): Promise<
  StorefrontGatewayResult<T['data']>
> {
  const operation =
    getShopifyOperationMetadata(
      query
    )

  const expectedOperationType =
    requestKind === 'mutation' ? 'mutation' : 'query'

  if (operation.type !== expectedOperationType) {
    throw new Error(
      `StorefrontGateway ${requestKind} requires a ${expectedOperationType} operation.`
    )
  }

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

  const deadline =
    createShopifyRequestDeadline({
      timeoutMs:
        resolvedTimeoutMs,
      ...(signal ?
        { callerSignal: signal }
      : {})
    })

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
          storefrontApiVersion,
        'shopify.storefront.request_kind':
          requestKind,
        'shopify.storefront.auth_mode':
          authMode,
        'shopify.storefront.has_buyer_ip':
          buyerIpPresent,
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

      let response:
        | Response
        | undefined

      try {
        response =
          await deadline.race(
            fetchImpl(
              endpoint,
              {
                method: 'POST',
                ...(cache ?
                  { cache }
                : {}),
                headers,
                signal:
                  deadline.signal,
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
          await readJsonWithDeadline(
            response,
            deadline
          )

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
              authMode,
              buyerIpPresent,
              operationName:
                operation.name,
              operationType:
                operation.type,
              requestKind,
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
              authMode,
              buyerIpPresent,
              operationName:
                operation.name,
              operationType:
                operation.type,
              requestKind,
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
        cancelResponseBody(response)

        const durationMs =
          elapsedMilliseconds(
            startedAt
          )

        const errorType =
          classifyShopifyRequestError({
            error,
            timeoutSignal:
              deadline.signal,
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
            authMode,
            buyerIpPresent,
            operationName:
              operation.name,
            operationType:
              operation.type,
            requestKind,
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
      } finally {
        deadline.dispose()
      }
    }
  )
}

type GatewayRequestInput<
  T extends ShopifyOperation<unknown, object>
> = {
  query: string
  signal?: AbortSignal
  timeoutMs?: number
  variables?: ExtractVariables<T>
}

type StorefrontClient = ReturnType<typeof createStorefrontClient>

function hasCredential(
  value: string | undefined
): value is string {
  return Boolean(value?.trim())
}

function resolveAuthentication({
  client,
  config,
  requestKind,
  context
}: {
  client: StorefrontClient
  config: HydrogenStorefrontGatewayConfig
  requestKind: StorefrontRequestKind
  context?: StorefrontBuyerContext
}): {
  authMode: StorefrontAuthMode
  buyerIpPresent: boolean
  headers: Record<string, string>
} {
  if (requestKind === 'catalog') {
    if (!hasCredential(config.publicStorefrontToken)) {
      throw new Error(
        'Missing Shopify public Storefront access token.'
      )
    }

    return {
      authMode: 'public',
      buyerIpPresent: false,
      headers: client.getPublicTokenHeaders()
    }
  }

  const buyerIp = context?.buyerIp ?? null

  if (hasCredential(config.privateStorefrontToken) && buyerIp) {
    return {
      authMode: 'private',
      buyerIpPresent: true,
      headers: client.getPrivateTokenHeaders({ buyerIp })
    }
  }

  if (hasCredential(config.publicStorefrontToken)) {
    return {
      authMode: 'public_fallback',
      buyerIpPresent: false,
      headers: client.getPublicTokenHeaders()
    }
  }

  if (hasCredential(config.privateStorefrontToken)) {
    throw new Error(
      'A validated buyer IP is required for private Shopify Storefront authentication.'
    )
  }

  throw new Error(
    'Missing Shopify Storefront access token.'
  )
}

export function createHydrogenStorefrontGateway(
  config: HydrogenStorefrontGatewayConfig,
  dependencies: HydrogenStorefrontGatewayDependencies = {
    fetch: globalThis.fetch
  }
): StorefrontGateway {
  const client = createStorefrontClient({
    storeDomain: config.storeDomain,
    storefrontApiVersion: config.storefrontApiVersion,
    contentType: 'json',
    ...(hasCredential(config.publicStorefrontToken) ?
      {
        publicStorefrontToken:
          config.publicStorefrontToken
      }
    : {}),
    ...(hasCredential(config.privateStorefrontToken) ?
      {
        privateStorefrontToken:
          config.privateStorefrontToken
      }
    : {})
  })
  const endpoint = client.getStorefrontApiUrl()

  async function dispatch<
    T extends ShopifyOperation<unknown, object>
  >(
    requestKind: StorefrontRequestKind,
    input: GatewayRequestInput<T>,
    context?: StorefrontBuyerContext,
    cache?: RequestCache
  ) {
    const authentication = resolveAuthentication({
      client,
      config,
      requestKind,
      ...(context ? { context } : {})
    })

    const result = await executeStorefrontRequest<T>({
      ...authentication,
      requestKind,
      endpoint,
      fetchImpl: dependencies.fetch,
      query: input.query,
      storefrontApiVersion: config.storefrontApiVersion,
      ...(cache !== undefined ? { cache } : {}),
      ...(input.signal ? { signal: input.signal } : {}),
      ...(input.timeoutMs !== undefined ?
        { timeoutMs: input.timeoutMs }
      : {}),
      ...(input.variables ? { variables: input.variables } : {})
    })

    const privateCredentialWasRejected =
      authentication.authMode === 'private' &&
      !result.success &&
      getShopifyGraphQLErrorMetadata(result.error).code ===
        'ACCESS_DENIED'

    if (
      !privateCredentialWasRejected ||
      !hasCredential(config.publicStorefrontToken)
    ) {
      return result
    }

    return executeStorefrontRequest<T>({
      authMode: 'public_fallback',
      buyerIpPresent: false,
      headers: client.getPublicTokenHeaders(),
      requestKind,
      endpoint,
      fetchImpl: dependencies.fetch,
      query: input.query,
      storefrontApiVersion: config.storefrontApiVersion,
      ...(cache !== undefined ? { cache } : {}),
      ...(input.signal ? { signal: input.signal } : {}),
      ...(input.timeoutMs !== undefined ?
        { timeoutMs: input.timeoutMs }
      : {}),
      ...(input.variables ? { variables: input.variables } : {})
    })
  }

  return {
    catalogQuery: async input =>
      dispatch('catalog', input, undefined, input.cache),
    buyerQuery: async input =>
      dispatch('buyer', input, input.context, 'no-store'),
    mutation: async input =>
      dispatch('mutation', input, input.context, 'no-store')
  }
}
