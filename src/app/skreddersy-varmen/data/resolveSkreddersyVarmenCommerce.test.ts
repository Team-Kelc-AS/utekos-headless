import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import test from 'node:test'

let loadCommerce: () => Promise<unknown> = async () => null
const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)
moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') return {}
  if (request === '@/lib/products/commerce') {
    return { getProductModel: () => loadCommerce() }
  }
  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { resolveSkreddersyVarmenCommerce } =
  require('./resolveSkreddersyVarmenCommerce.ts') as typeof import('./resolveSkreddersyVarmenCommerce')

test('passes the resolved commerce model through unchanged', async () => {
  const model = { publicHandle: 'utekos-techdown' }
  loadCommerce = async () => model
  assert.equal(await resolveSkreddersyVarmenCommerce(), model)
})

test('returns unavailable commerce when the product loader fails', async () => {
  loadCommerce = async () => {
    throw new Error(
      'Shopify unavailable without a valid snapshot'
    )
  }
  assert.equal(await resolveSkreddersyVarmenCommerce(), null)
})

test('lets Next handle prerender cancellation instead of caching unavailability', async () => {
  const frameworkError = Object.assign(
    new Error('Prerender completed'),
    { digest: 'HANGING_PROMISE_REJECTION' }
  )
  loadCommerce = async () => {
    throw frameworkError
  }
  await assert.rejects(
    resolveSkreddersyVarmenCommerce(),
    frameworkError
  )
})
