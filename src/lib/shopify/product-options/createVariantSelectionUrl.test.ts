import assert from 'node:assert/strict'
import test from 'node:test'
import { createVariantSelectionUrl } from './createVariantSelectionUrl'

test('writes readable Utekos options and preserves attribution parameters', () => {
  const url = createVariantSelectionUrl({
    handle: 'utekos-techdown',
    selectedOptions: [
      { name: 'Farge', value: 'Havdyp' },
      { name: 'Størrelse', value: 'Stor' },
      { name: 'Kjønn', value: 'Unisex' }
    ],
    searchParams: new URLSearchParams(
      'variant=gid%3A%2F%2Fshopify%2FProductVariant%2F3&farge=Vargnatt&storrelse=Medium&kjonn=Unisex&pilot=1&utm_source=test&fbclid=abc&msclkid=xyz'
    )
  })

  const parsedUrl = new URL(url, 'https://utekos.no')

  assert.equal(
    parsedUrl.pathname,
    '/produkter/utekos-techdown'
  )
  assert.equal(parsedUrl.searchParams.get('farge'), 'havdyp')
  assert.equal(parsedUrl.searchParams.get('storrelse'), 'stor')
  assert.equal(parsedUrl.searchParams.get('kjonn'), 'unisex')
  assert.equal(parsedUrl.searchParams.get('pilot'), '1')
  assert.equal(parsedUrl.searchParams.get('utm_source'), 'test')
  assert.equal(parsedUrl.searchParams.get('fbclid'), 'abc')
  assert.equal(parsedUrl.searchParams.get('msclkid'), 'xyz')
  assert.equal(parsedUrl.searchParams.has('variant'), false)
  assert.equal(url.includes('gid%3A%2F%2Fshopify'), false)
})

test('replaces previous readable options without duplicating them', () => {
  const url = createVariantSelectionUrl({
    handle: 'utekos-techdown',
    selectedOptions: [
      { name: 'Farge', value: 'Havdyp' },
      { name: 'Størrelse', value: 'Større' },
      { name: 'Kjønn', value: 'Unisex' }
    ],
    searchParams: new URLSearchParams(
      'variant=gid%3A%2F%2Fshopify%2FProductVariant%2F1&storrelse=middels&storrelse=stor'
    )
  })

  const parsedUrl = new URL(url, 'https://utekos.no')

  assert.deepEqual(parsedUrl.searchParams.getAll('storrelse'), [
    'storre'
  ])
  assert.equal(parsedUrl.searchParams.has('variant'), false)
})
