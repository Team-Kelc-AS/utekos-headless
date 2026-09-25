import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createOsCaravanMapEmbedUrl,
  createOsCaravanOsmEmbedUrl
} from './createOsCaravanMapEmbedUrl'

test('builds a place-mode Embed URL pinned to Os Caravan', () => {
  const embedUrl = createOsCaravanMapEmbedUrl('test-maps-key')

  assert.ok(embedUrl)
  const parsed = new URL(embedUrl)
  assert.equal(parsed.origin, 'https://www.google.com')
  assert.equal(parsed.pathname, '/maps/embed/v1/place')
  assert.equal(parsed.searchParams.get('key'), 'test-maps-key')
  assert.equal(
    parsed.searchParams.get('q'),
    'Os Caravan & Fritid, Industrivegen 2, 5210 Os'
  )
  assert.equal(parsed.searchParams.get('zoom'), '16')
  assert.equal(parsed.searchParams.get('language'), 'no')
  assert.equal(parsed.searchParams.get('region'), 'NO')
})

test('falls back to an OpenStreetMap pin when the Maps key is missing', () => {
  const embedUrl = createOsCaravanMapEmbedUrl('')
  const osmUrl = createOsCaravanOsmEmbedUrl()

  assert.equal(embedUrl, osmUrl)
  const parsed = new URL(embedUrl)
  assert.equal(parsed.origin, 'https://www.openstreetmap.org')
  assert.equal(parsed.pathname, '/export/embed.html')
  assert.equal(parsed.searchParams.get('layer'), 'mapnik')
  assert.equal(parsed.searchParams.get('marker'), '60.20463,5.449656')
  assert.equal(
    parsed.searchParams.get('bbox'),
    '5.437656,60.192630,5.461656,60.216630'
  )
})
