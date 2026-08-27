import assert from 'node:assert/strict'
import {
  existsSync
} from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const repoRoot = process.cwd()

const helperRelativePath =
  'src/api/shopify/request/shopifyRequestObservability.ts'

const gatewayAdapterRelativePath =
  'src/api/shopify/storefront/createHydrogenStorefrontGateway.ts'

async function readSource(
  relativePath: string
): Promise<string> {
  return readFile(
    join(repoRoot, relativePath),
    'utf8'
  )
}

type ObservabilityModule = {
  DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS: number
  SHOPIFY_TIMEOUT_OVERSHOOT_WARN_MS: number
  SLOW_SHOPIFY_STOREFRONT_REQUEST_MS: number
  getShopifyOperationMetadata: (
    query: string
  ) => {
    name: string
    type:
      | 'query'
      | 'mutation'
      | 'subscription'
  }
  getShopifyGraphQLErrorMetadata: (
    response: {
      errors: Array<{
        message: string
        extensions?: {
          code?: string
          requestId?: unknown
          [key: string]: unknown
        }
      }>
    }
  ) => {
    code?: string
    requestId?: string
  }
  classifyShopifyRequestError: (input: {
    error: unknown
    didTimeout: boolean
    callerSignal?: AbortSignal
  }) => string
  getShopifyTimeoutDiagnostics: (input: {
    errorType: string
    durationMs: number
    timeoutMs: number
    responseHeadersMs?: number
  }) => {
    timeoutPhase?: 'headers' | 'body'
    timeoutOvershootMs?: number
    timeoutState?: 'on_time' | 'delayed'
  }
}

test(
  'Shopify observability helper exposes low-cardinality operation and error metadata',
  async () => {
    const absolutePath = join(
      repoRoot,
      helperRelativePath
    )

    assert.equal(
      existsSync(absolutePath),
      true,
      `${helperRelativePath} must exist`
    )

    const observability =
      await import(
        pathToFileURL(absolutePath).href
      ) as ObservabilityModule

    assert.equal(
      observability
        .DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS,
      8_000
    )

    assert.equal(
      observability
        .SLOW_SHOPIFY_STOREFRONT_REQUEST_MS,
      1_000
    )

    assert.deepEqual(
      observability.getShopifyOperationMetadata(`
        query getProduct($handle: String!) {
          product(handle: $handle) {
            id
          }
        }
      `),
      {
        name: 'getProduct',
        type: 'query'
      }
    )

    assert.deepEqual(
      observability.getShopifyOperationMetadata(`
        mutation cartLinesAdd(
          $cartId: ID!
        ) {
          cartLinesAdd(
            cartId: $cartId
          ) {
            cart {
              id
            }
          }
        }
      `),
      {
        name: 'cartLinesAdd',
        type: 'mutation'
      }
    )

    assert.deepEqual(
      observability.getShopifyOperationMetadata(`
        {
          shop {
            name
          }
        }
      `),
      {
        name: 'anonymous',
        type: 'query'
      }
    )

    assert.deepEqual(
      observability
        .getShopifyGraphQLErrorMetadata({
          errors: [
            {
              message: 'Internal error',
              extensions: {
                code:
                  'INTERNAL_SERVER_ERROR',
                requestId:
                  'request-from-extension'
              }
            }
          ]
        }),
      {
        code:
          'INTERNAL_SERVER_ERROR',
        requestId:
          'request-from-extension'
      }
    )

    assert.deepEqual(
      observability
        .getShopifyGraphQLErrorMetadata({
          errors: [
            {
              message:
                'Internal error. Request ID: 1b355a21-7117-44c5-8d8b-8948082f40a8'
            }
          ]
        }),
      {
        requestId:
          '1b355a21-7117-44c5-8d8b-8948082f40a8'
      }
    )
  }
)

test(
  'Shopify request error classification distinguishes timeout, caller abort and transport failure',
  async () => {
    const absolutePath = join(
      repoRoot,
      helperRelativePath
    )

    assert.equal(
      existsSync(absolutePath),
      true,
      `${helperRelativePath} must exist`
    )

    const observability =
      await import(
        pathToFileURL(absolutePath).href
      ) as ObservabilityModule

    const idleController =
      new AbortController()

    assert.equal(
      observability
        .classifyShopifyRequestError({
          error:
            new Error('timed out'),
          didTimeout: true,
          callerSignal:
            idleController.signal
        }),
      'timeout'
    )

    const callerController =
      new AbortController()

    callerController.abort()

    assert.equal(
      observability
        .classifyShopifyRequestError({
          error:
            new Error('aborted'),
          didTimeout: false,
          callerSignal:
            callerController.signal
        }),
      'aborted'
    )

    assert.equal(
      observability
        .classifyShopifyRequestError({
          error:
            new TypeError(
              'fetch failed'
            ),
          didTimeout: false
        }),
      'TypeError'
    )

    assert.deepEqual(
      observability.getShopifyTimeoutDiagnostics({
        errorType: 'timeout',
        durationMs: 100_121,
        timeoutMs: 8_000
      }),
      {
        timeoutPhase: 'headers',
        timeoutOvershootMs: 92_121,
        timeoutState: 'delayed'
      }
    )

    assert.deepEqual(
      observability.getShopifyTimeoutDiagnostics({
        errorType: 'timeout',
        durationMs: 8_020,
        timeoutMs: 8_000,
        responseHeadersMs: 1_186
      }),
      {
        timeoutPhase: 'body',
        timeoutOvershootMs: 20,
        timeoutState: 'on_time'
      }
    )

    assert.deepEqual(
      observability.getShopifyTimeoutDiagnostics({
        errorType: 'aborted',
        durationMs: 250,
        timeoutMs: 8_000
      }),
      {}
    )
  }
)

test(
  'StorefrontGateway adapter applies policy, deadlines and payload-safe observability',
  async () => {
    const source = await readSource(
      gatewayAdapterRelativePath
    )

    assert.match(
      source,
      /DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS/
    )

    assert.match(
      source,
      /createShopifyRequestDeadline\(/
    )

    assert.match(
      source,
      /deadline\.race\(/
    )

    assert.match(
      source,
      /readJsonWithDeadline\(/
    )

    assert.match(
      source,
      /cancelResponseBody\(/
    )

    assert.doesNotMatch(
      source,
      /AbortSignal\.timeout\(/
    )

    assert.match(
      source,
      /startAnalyticsSpan\(/
    )

    assert.match(
      source,
      /createStorefrontClient\(/
    )

    assert.match(
      source,
      /getPublicTokenHeaders\(/
    )

    assert.match(
      source,
      /getPrivateTokenHeaders\(\{ buyerIp \}\)/
    )

    assert.match(
      source,
      /name:\s*`Shopify Storefront \$\{operation\.name\}`/
    )

    assert.match(
      source,
      /op:\s*['"]rpc\.client['"]/
    )

    assert.match(
      source,
      /['"]graphql\.operation\.name['"]/
    )

    assert.match(
      source,
      /['"]graphql\.operation\.type['"]/
    )

    assert.match(
      source,
      /['"]server\.address['"]/
    )

    assert.match(
      source,
      /['"]shopify\.api\.version['"]/
    )

    assert.match(
      source,
      /['"]shopify\.fetch\.cache_mode['"]/
    )

    assert.match(
      source,
      /['"]shopify\.storefront\.request_kind['"]/
    )

    assert.match(
      source,
      /['"]shopify\.storefront\.auth_mode['"]/
    )

    assert.match(
      source,
      /['"]shopify\.storefront\.has_buyer_ip['"]/
    )

    assert.match(
      source,
      /['"]shopify\.timeout_ms['"]/
    )

    assert.match(
      source,
      /response\.headers\.get\(\s*['"]x-request-id['"]\s*\)/
    )

    assert.match(
      source,
      /['"]shopify\.request_id['"]/
    )

    assert.match(
      source,
      /['"]shopify\.duration_ms['"]/
    )

    assert.match(
      source,
      /['"]shopify\.response_headers_ms['"]/
    )

    assert.match(
      source,
      /['"]shopify\.response_body_ms['"]/
    )

    assert.match(
      source,
      /shopify\.storefront\.slow_request/
    )

    assert.match(
      source,
      /shopify\.storefront\.request_failed/
    )

    assert.match(
      source,
      /shopify\.storefront\.optional_request_failed/
    )

    assert.match(
      source,
      /shopify\.storefront\.request_cancelled/
    )

    assert.match(
      source,
      /timeoutOvershootMs/
    )

    assert.match(
      source,
      /timeoutPhase/
    )

    assert.match(
      source,
      /shopify\.storefront\.graphql_error/
    )

    assert.doesNotMatch(
      source,
      /['"]graphql\.document['"]/
    )

    assert.doesNotMatch(
      source,
      /from\s+['"]next\/headers['"]/
    )

    assert.doesNotMatch(
      source,
      /\bheaders\(\)/
    )

    assert.doesNotMatch(
      source,
      /\bcookies\(\)/
    )

    assert.doesNotMatch(
      source,
      /X-Shopify-Storefront-Access-Token/
    )

    assert.doesNotMatch(
      source,
      /Shopify-Storefront-Private-Token/
    )
  }
)
