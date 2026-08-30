import assert from 'node:assert/strict'
import test from 'node:test'
import type { ShopifyOperation } from '@types'
import { createHydrogenStorefrontGateway } from './createHydrogenStorefrontGateway'

type TestQuery = ShopifyOperation<
  { shop: { name: string } },
  Record<string, never>
>

type TestMutation = ShopifyOperation<
  { cartCreate: { cart: { id: string } } },
  Record<string, never>
>

const query = /* GraphQL */ `
  query GatewayTestQuery {
    shop {
      name
    }
  }
`

const mutation = /* GraphQL */ `
  mutation GatewayTestMutation {
    cartCreate {
      cart {
        id
      }
    }
  }
`

function createGateway() {
  const requests: RequestInit[] = []
  const fetchImpl: typeof fetch = async (_input, init) => {
    requests.push(init ?? {})

    return Response.json({
      data: {
        shop: { name: 'Utekos' },
        cartCreate: { cart: { id: 'gid://shopify/Cart/test' } }
      }
    })
  }
  const gateway = createHydrogenStorefrontGateway(
    {
      storeDomain: 'example.myshopify.com',
      publicStorefrontToken: 'public-test-token',
      privateStorefrontToken: 'private-test-token',
      storefrontApiVersion: '2026-04'
    },
    { fetch: fetchImpl }
  )

  return { gateway, requests }
}

test('catalogQuery uses public auth and remains caller-cacheable', async () => {
  const { gateway, requests } = createGateway()

  await gateway.catalogQuery<TestQuery>({
    cache: 'force-cache',
    query
  })

  const request = requests[0]
  const headers = new Headers(request?.headers)

  assert.equal(request?.cache, 'force-cache')
  assert.equal(
    headers.get('x-shopify-storefront-access-token'),
    'public-test-token'
  )
  assert.equal(
    headers.has('shopify-storefront-private-token'),
    false
  )
  assert.equal(headers.has('shopify-storefront-buyer-ip'), false)
})
test('buyerQuery uses private auth with buyer IP and forces no-store', async () => {
  const { gateway, requests } = createGateway()

  await gateway.buyerQuery<TestQuery>({
    context: { buyerIp: '203.0.113.8' },
    query
  })

  const request = requests[0]
  const headers = new Headers(request?.headers)

  assert.equal(request?.cache, 'no-store')
  assert.equal(
    headers.get('shopify-storefront-private-token'),
    'private-test-token'
  )
  assert.equal(
    headers.get('shopify-storefront-buyer-ip'),
    '203.0.113.8'
  )
  assert.equal(
    headers.has('x-shopify-storefront-access-token'),
    false
  )
})

test('mutation uses private buyer auth and forces no-store', async () => {
  const { gateway, requests } = createGateway()

  await gateway.mutation<TestMutation>({
    context: { buyerIp: '2001:db8::8' },
    query: mutation
  })

  const request = requests[0]
  const headers = new Headers(request?.headers)

  assert.equal(request?.cache, 'no-store')
  assert.equal(
    headers.get('shopify-storefront-private-token'),
    'private-test-token'
  )
  assert.equal(
    headers.get('shopify-storefront-buyer-ip'),
    '2001:db8::8'
  )
})

test('buyer calls use the public compatibility path when private auth is unavailable', async () => {
  const requests: RequestInit[] = []
  const gateway = createHydrogenStorefrontGateway(
    {
      storeDomain: 'example.myshopify.com',
      publicStorefrontToken: 'public-test-token',
      storefrontApiVersion: '2026-04'
    },
    {
      fetch: async (_input, init) => {
        requests.push(init ?? {})
        return Response.json({
          data: { shop: { name: 'Utekos' } }
        })
      }
    }
  )

  await gateway.buyerQuery<TestQuery>({
    context: { buyerIp: '203.0.113.8' },
    query
  })

  const request = requests[0]
  const headers = new Headers(request?.headers)

  assert.equal(request?.cache, 'no-store')
  assert.equal(
    headers.get('x-shopify-storefront-access-token'),
    'public-test-token'
  )
  assert.equal(
    headers.has('shopify-storefront-private-token'),
    false
  )
  assert.equal(headers.has('shopify-storefront-buyer-ip'), false)
})

test('mutation uses the public compatibility path when private auth is unavailable', async () => {
  const requests: RequestInit[] = []
  const gateway = createHydrogenStorefrontGateway(
    {
      storeDomain: 'example.myshopify.com',
      publicStorefrontToken: 'public-test-token',
      storefrontApiVersion: '2026-04'
    },
    {
      fetch: async (_input, init) => {
        requests.push(init ?? {})
        return Response.json({
          data: { cartCreate: { cart: null } }
        })
      }
    }
  )

  await gateway.mutation<TestMutation>({
    context: { buyerIp: '203.0.113.8' },
    query: mutation
  })

  const request = requests[0]
  const headers = new Headers(request?.headers)

  assert.equal(request?.cache, 'no-store')
  assert.equal(
    headers.get('x-shopify-storefront-access-token'),
    'public-test-token'
  )
  assert.equal(
    headers.has('shopify-storefront-private-token'),
    false
  )
  assert.equal(headers.has('shopify-storefront-buyer-ip'), false)
})

test('mutation retries with public auth when Shopify rejects the configured private credential', async () => {
  const requests: RequestInit[] = []
  const gateway = createHydrogenStorefrontGateway(
    {
      storeDomain: 'example.myshopify.com',
      publicStorefrontToken: 'public-test-token',
      privateStorefrontToken: 'rejected-private-token',
      storefrontApiVersion: '2026-04'
    },
    {
      fetch: async (_input, init) => {
        requests.push(init ?? {})

        if (requests.length === 1) {
          return Response.json(
            {
              errors: [
                {
                  message: '',
                  extensions: { code: 'ACCESS_DENIED' }
                }
              ]
            },
            { status: 403 }
          )
        }

        return Response.json({
          data: {
            cartCreate: {
              cart: { id: 'gid://shopify/Cart/test' }
            }
          }
        })
      }
    }
  )

  const result = await gateway.mutation<TestMutation>({
    context: { buyerIp: '203.0.113.8' },
    query: mutation
  })

  assert.equal(result.success, true)
  assert.equal(requests.length, 2)

  const privateHeaders = new Headers(requests[0]?.headers)
  const fallbackHeaders = new Headers(requests[1]?.headers)

  assert.equal(
    privateHeaders.get('shopify-storefront-private-token'),
    'rejected-private-token'
  )
  assert.equal(
    fallbackHeaders.get('x-shopify-storefront-access-token'),
    'public-test-token'
  )
  assert.equal(
    fallbackHeaders.has('shopify-storefront-private-token'),
    false
  )
  assert.equal(
    fallbackHeaders.has('shopify-storefront-buyer-ip'),
    false
  )
})

test('buyer calls fall back to public auth when a validated buyer IP is unavailable', async () => {
  const { gateway, requests } = createGateway()

  await gateway.buyerQuery<TestQuery>({
    context: { buyerIp: null },
    query
  })

  const request = requests[0]
  const headers = new Headers(request?.headers)

  assert.equal(request?.cache, 'no-store')
  assert.equal(
    headers.get('x-shopify-storefront-access-token'),
    'public-test-token'
  )
  assert.equal(
    headers.has('shopify-storefront-private-token'),
    false
  )
  assert.equal(headers.has('shopify-storefront-buyer-ip'), false)
})

test('private buyer auth fails closed without a validated buyer IP or public fallback', async () => {
  const requests: RequestInit[] = []
  const gateway = createHydrogenStorefrontGateway(
    {
      storeDomain: 'example.myshopify.com',
      privateStorefrontToken: 'private-test-token',
      storefrontApiVersion: '2026-04'
    },
    {
      fetch: async (_input, init) => {
        requests.push(init ?? {})
        return Response.json({
          data: { shop: { name: 'Utekos' } }
        })
      }
    }
  )

  await assert.rejects(
    gateway.buyerQuery<TestQuery>({
      context: { buyerIp: null },
      query
    }),
    /validated buyer IP is required/
  )
  assert.equal(requests.length, 0)
})

test('enforces a wall-clock deadline around hanging response bodies', async () => {
  let cancelled = false
  let releaseCancellation: (() => void) | undefined
  const cancellation = new Promise<void>(resolve => {
    releaseCancellation = resolve
  })
  const reader = {
    read: () =>
      new Promise<ReadableStreamReadResult<Uint8Array>>(
        () => undefined
      ),
    cancel: () => {
      cancelled = true
      return cancellation
    }
  }
  const hangingResponse = {
    body: { locked: true, getReader: () => reader },
    headers: new Headers({
      'content-type': 'application/json',
      'x-request-id': 'hanging-body'
    }),
    ok: true,
    status: 200
  } as unknown as Response
  const gateway = createHydrogenStorefrontGateway(
    {
      storeDomain: 'example.myshopify.com',
      publicStorefrontToken: 'public-test-token',
      storefrontApiVersion: '2026-04'
    },
    { fetch: async () => hangingResponse }
  )
  const startedAt = performance.now()
  const releaseTimer = setTimeout(
    () => releaseCancellation?.(),
    600
  )

  try {
    await assert.rejects(
      gateway.catalogQuery<TestQuery>({ query, timeoutMs: 40 }),
      (error: unknown) =>
        error instanceof DOMException &&
        error.name === 'TimeoutError'
    )

    assert.equal(cancelled, true)
    assert.ok(
      performance.now() - startedAt < 400,
      'hanging JSON bodies must not outlive the Shopify deadline'
    )
  } finally {
    clearTimeout(releaseTimer)
    releaseCancellation?.()
  }
})

test('rejects an operation that crosses the declared gateway boundary', async () => {
  const { gateway, requests } = createGateway()

  await assert.rejects(
    gateway.catalogQuery<TestMutation>({ query: mutation }),
    /catalog requires a query operation/
  )
  await assert.rejects(
    gateway.mutation<TestQuery>({
      context: { buyerIp: '203.0.113.8' },
      query
    }),
    /mutation requires a mutation operation/
  )
  assert.equal(requests.length, 0)
})
