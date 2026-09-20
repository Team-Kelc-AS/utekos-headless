import assert from 'node:assert/strict'

const origin = new URL(
  process.argv[2] ?? 'http://127.0.0.1:3217'
)
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname),
  'Run this synthetic attribution smoke against a local server only.'
)

const names = [
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
const query = names
  .map(name => `${name}=%20Test%20AbC%2b%2F%3D%C3%B8%20`)
  .join('&')
const selectors =
  'variant=123&farge=patriot-blue&storrelse=XL&kjonn=unisex'
const routes = [
  ['/', '/nbcc', false],
  ['/magasinet/artikkel', '/magasinet/oppgradering', false],
  [
    '/skreddersy-varmen/layout/legacy',
    '/skreddersy-varmen',
    true
  ]
]

for (const [source, destination, hasSelectors] of routes) {
  for (const withAttribution of [true, false]) {
    const expected = new URLSearchParams(
      withAttribution ?
        `${query}&fbclid=Second%2BValue${hasSelectors ? `&${selectors}` : ''}`
      : ''
    )
    const input = new URL(source, origin)
    input.search =
      withAttribution ?
        `${query}&fbclid=Second%2BValue&${selectors}&email=synthetic%40example.invalid&token=private`
      : 'email=synthetic%40example.invalid&token=private'
    const response = await fetch(input, {
      redirect: 'manual',
      headers: {
        'accept': 'text/html',
        'sec-fetch-dest': 'document',
        'referer': 'https://nbocc.no/'
      },
      signal: AbortSignal.timeout(15_000)
    })
    assert.equal(response.status, 307)
    const location = response.headers.get('location')
    assert.ok(location)
    const result = new URL(location, origin)
    assert.equal(result.origin, origin.origin)
    assert.equal(result.pathname, destination)
    assert.deepEqual(
      [...new Set(result.searchParams.keys())].sort(),
      [...new Set(expected.keys())].sort()
    )
    for (const name of new Set(expected.keys())) {
      assert.deepEqual(
        result.searchParams.getAll(name),
        expected.getAll(name),
        name
      )
    }
    if (!withAttribution) assert.equal(result.search, '')
    assert.match(
      response.headers.get('set-cookie') ?? '',
      /_fbp=/
    )
    assert.equal(
      (response.headers.get('set-cookie') ?? '').includes(
        '_fbc='
      ),
      withAttribution
    )
    assert.match(
      response.headers.get('cache-control') ?? '',
      /private.*no-store/
    )
    console.log(
      JSON.stringify({
        source,
        destination,
        withAttribution,
        status: 307,
        parameterValuesPreserved: true,
        unknownParametersRemoved: true,
        metaCookiesCaptured: true
      })
    )
  }
}
