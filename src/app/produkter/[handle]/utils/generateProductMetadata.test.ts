import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'

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
  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { generateProductMetadata } =
  require('./generateProductMetadata.ts') as typeof import('./generateProductMetadata')

test('uses honest presentation metadata when Shopify times out', async () => {
  const metadata = await generateProductMetadata(
    'utekos-techdown',
    {
      loadProduct: async () => {
        throw new DOMException(
          'Shopify request timed out',
          'TimeoutError'
        )
      }
    }
  )

  assert.equal(metadata.title, 'Utekos TechDown™')
  assert.equal(
    metadata.alternates?.canonical,
    '/produkter/utekos-techdown'
  )
  assert.deepEqual(metadata.openGraph?.images, [
    {
      url: 'https://utekos.no/og-image-utekos-produkter.jpg',
      width: 1200,
      height: 630,
      alt: 'Utekos TechDown™ i mørkeblå Havdyp.'
    }
  ])
})

test('keeps missing-product metadata for unknown public handles', async () => {
  let loadCount = 0
  const metadata = await generateProductMetadata(
    'unknown-product',
    {
      loadProduct: async () => {
        loadCount += 1
        return null
      }
    }
  )

  assert.equal(metadata.title, 'Produkt ikke funnet')
  assert.equal(loadCount, 0)
})
