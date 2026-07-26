import assert from 'node:assert/strict'
import test from 'node:test'
import { createVariantSelectionUrl } from './createVariantSelectionUrl'

test('writes the canonical variant GID and preserves unrelated parameters', () => {
  const url = createVariantSelectionUrl({
    handle: 'utekos-mikrofiber',
    variantId: 'gid://shopify/ProductVariant/3',
    optionNames: ['Farge', 'Størrelse', 'Kjønn'],
    searchParams: new URLSearchParams(
      'farge=Vargnatt&storrelse=Medium&kjonn=Unisex&pilot=1&utm_source=test'
    )
  })

  const parsedUrl = new URL(url, 'https://utekos.no')

  assert.equal(
    parsedUrl.pathname,
    '/produkter/utekos-mikrofiber'
  )
  assert.equal(
    parsedUrl.searchParams.get('variant'),
    'gid://shopify/ProductVariant/3'
  )
  assert.equal(parsedUrl.searchParams.get('pilot'), '1')
  assert.equal(parsedUrl.searchParams.get('utm_source'), 'test')
  assert.equal(parsedUrl.searchParams.has('farge'), false)
  assert.equal(parsedUrl.searchParams.has('storrelse'), false)
  assert.equal(parsedUrl.searchParams.has('kjonn'), false)
})

test('replaces a previous canonical variant without duplicating it', () => {
  const url = createVariantSelectionUrl({
    handle: 'utekos-mikrofiber',
    variantId: 'gid://shopify/ProductVariant/4',
    optionNames: ['Farge'],
    searchParams: new URLSearchParams(
      'variant=gid%3A%2F%2Fshopify%2FProductVariant%2F1'
    )
  })

  const parsedUrl = new URL(url, 'https://utekos.no')

  assert.deepEqual(parsedUrl.searchParams.getAll('variant'), [
    'gid://shopify/ProductVariant/4'
  ])
})
