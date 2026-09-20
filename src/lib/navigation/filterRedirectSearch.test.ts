import assert from 'node:assert/strict'
import test from 'node:test'
import { filterRedirectSearch } from './filterRedirectSearch'

const attributionNames = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
  'dclid',
  'epik',
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'sc_click_id',
  'ScCid',
  'ttclid',
  'twclid',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'hsa_cam',
  'hsa_grp',
  'hsa_ad'
]

for (const destination of [
  'nbcc',
  'magazine',
  'landing'
] as const) {
  test(`${destination} forwards all 26 approved attribution names without changing values`, () => {
    const expected = attributionNames
      .map(name => `${name}=AbC%2b%2F%3D%20%C3%B8+Test`)
      .join('&')
    const input = `?email=synthetic%40example.invalid&${expected}&phone=123&token=secret&redirect=https%3A%2F%2Fexample.invalid`
    assert.equal(
      filterRedirectSearch(input, destination),
      `?${expected}`
    )
  })
}

test('preserves opaque click IDs, percent encoding, repeated values and their order', () => {
  const expected =
    '?ScCid=%20AbC-._%2B%2f%3D%20&fbclid=First&fbclid=Second&utm_campaign=Vinter%20Norge&utm_content=a+b&utm_term=&utm_id'
  assert.equal(
    filterRedirectSearch(`${expected}&private=value`, 'nbcc'),
    expected
  )
})

test('recognizes decoded parameter names without changing their encoding or permitting case aliases', () => {
  assert.equal(
    filterRedirectSearch(
      '?%53cCid=original&ScCid=second&sccid=wrong&SCCID=wrong&UTM_SOURCE=wrong&fbclid_extra=wrong',
      'magazine'
    ),
    '?%53cCid=original&ScCid=second'
  )
})

test('preserves product selectors only on the retired layout redirect', () => {
  const selectors =
    'variant=gid%3A%2F%2Fshopify%2FProductVariant%2F123&farge=patriot-blue&storrelse=XL&kjonn=unisex'
  assert.equal(
    filterRedirectSearch(
      `?${selectors}&utm_source=test&email=private`,
      'landing'
    ),
    `?${selectors}&utm_source=test`
  )
  for (const destination of ['nbcc', 'magazine'] as const) {
    assert.equal(
      filterRedirectSearch(
        `?${selectors}&utm_source=test`,
        destination
      ),
      '?utm_source=test'
    )
  }
})

test('drops unknown, malformed and empty keys without creating a bare query marker', () => {
  for (const search of [
    '',
    '?',
    '?email=private&token=secret',
    '?&&=value&%zz=bad&__proto__=bad'
  ]) {
    assert.equal(filterRedirectSearch(search, 'nbcc'), '')
  }
})

test('keeps an encoded delimiter inside its original value', () => {
  const search =
    '?utm_campaign=Winter%26email%3Dsynthetic%40example.invalid&email=removed'
  const result = filterRedirectSearch(search, 'magazine')
  assert.equal(
    result,
    '?utm_campaign=Winter%26email%3Dsynthetic%40example.invalid'
  )
  assert.deepEqual(
    [...new URLSearchParams(result).keys()],
    ['utm_campaign']
  )
})

test('does not reinterpret a question mark inside a parameter name as the query prefix', () => {
  assert.equal(
    filterRedirectSearch(
      '??utm_source=wrong&?fbclid=wrong&%3FScCid=wrong&utm_source=correct',
      'nbcc'
    ),
    '?utm_source=correct'
  )
})
