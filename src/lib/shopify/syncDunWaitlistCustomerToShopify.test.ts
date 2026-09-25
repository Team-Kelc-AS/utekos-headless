import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'

const loader = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const original = loader._load
loader._load = (request, parent, isMain) =>
  request === 'server-only' ?
    {}
  : original.call(Module, request, parent, isMain)
const require = createRequire(import.meta.url)
const { syncDunWaitlistCustomerToShopify } =
  require('./syncDunWaitlistCustomerToShopify.ts') as typeof import('./syncDunWaitlistCustomerToShopify')
loader._load = original

test('Shopify receives dunvarsel plus the optional size tag without replacing customer tags', async () => {
  for (const estimatedSize of [
    undefined,
    'Small',
    'Medium',
    'Large'
  ] as const) {
    const calls: Array<{
      query: string
      variables: Record<string, unknown> | undefined
    }> = []
    const result = await syncDunWaitlistCustomerToShopify(
      {
        email: 'test@example.com',
        ...(estimatedSize ? { estimatedSize } : {})
      },
      {
        graphql: async <T>(
          query: string,
          variables?: Record<string, unknown>
        ) => {
          calls.push({ query, variables })
          return (
            query.includes('customerByIdentifier') ?
              { customer: { id: 'gid://shopify/Customer/1' } }
            : {
                tagsAdd: {
                  node: { id: 'gid://shopify/Customer/1' },
                  userErrors: []
                }
              }) as T
        }
      }
    )
    assert.equal(result.customerId, 'gid://shopify/Customer/1')
    assert.equal(calls.length, 2)
    assert.match(calls[1]!.query, /tagsAdd/)
    assert.deepEqual(calls[1]!.variables?.tags, [
      'dunvarsel',
      ...(estimatedSize ?
        [`dunvarsel-size-${estimatedSize.toLowerCase()}`]
      : [])
    ])
  }
})
