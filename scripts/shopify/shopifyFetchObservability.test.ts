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

const fetchRelativePath =
  'src/api/shopify/request/fetchShopify.ts'

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
  classifyShopifyFetchError: (input: {
    error: unknown
    timeoutSignal: AbortSignal
    callerSignal?: AbortSignal
  }) => string
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
  'Shopify fetch error classification distinguishes timeout, caller abort and transport failure',
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

    const timedOutSignal =
      AbortSignal.abort()

    const idleController =
      new AbortController()

    assert.equal(
      observability
        .classifyShopifyFetchError({
          error:
            new Error('timed out'),
          timeoutSignal:
            timedOutSignal,
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
        .classifyShopifyFetchError({
          error:
            new Error('aborted'),
          timeoutSignal:
            idleController.signal,
          callerSignal:
            callerController.signal
        }),
      'aborted'
    )

    assert.equal(
      observability
        .classifyShopifyFetchError({
          error:
            new TypeError(
              'fetch failed'
            ),
          timeoutSignal:
            idleController.signal
        }),
      'TypeError'
    )
  }
)

test(
  'shopifyFetch applies deadline and emits GraphQL request observability without request payloads',
  async () => {
    const source = await readSource(
      fetchRelativePath
    )

    assert.match(
      source,
      /DEFAULT_SHOPIFY_STOREFRONT_TIMEOUT_MS/
    )

    assert.match(
      source,
      /AbortSignal\.timeout\(\s*resolvedTimeoutMs\s*\)/
    )

    assert.match(
      source,
      /AbortSignal\.any\(\s*\[\s*signal\s*,\s*timeoutSignal\s*\]\s*\)/
    )

    assert.match(
      source,
      /startAnalyticsSpan\(/
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
  }
)