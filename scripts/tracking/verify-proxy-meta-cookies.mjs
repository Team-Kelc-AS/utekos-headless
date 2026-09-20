import assert from 'node:assert/strict'

const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:3107')
assert.ok(
  ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) ||
    (origin.origin === 'https://utekos.no' && process.argv.includes('--production')),
  'Only localhost or explicitly selected Utekos production may be probed.'
)

async function read(path, cookie, extraHeaders = {}) {
  const response = await fetch(new URL(path, origin), {
    redirect: 'manual',
    headers: {
      accept: 'text/html',
      'sec-fetch-dest': 'document',
      'user-agent': 'Utekos proxy-cookie HTTP verification/1.0 (no JavaScript; no events)',
      ...(cookie ? { cookie } : {}),
      ...extraHeaders
    },
    signal: AbortSignal.timeout(20000)
  })
  const setCookies = response.headers.getSetCookie()
  const values = Object.fromEntries(setCookies.map(value => {
    const pair = value.split(';', 1)[0]
    const separator = pair.indexOf('=')
    return [pair.slice(0, separator), decodeURIComponent(pair.slice(separator + 1))]
  }))
  await response.arrayBuffer()
  for (const name of ['cookie', 'x-middleware-request-cookie', 'x-middleware-override-headers']) {
    assert.equal(response.headers.get(name), null, `Internal header exposed: ${name}`)
  }
  return { response, setCookies, values }
}

const first = await read('/produkter')
assert.equal(first.response.status, 200)
assert.match(first.values._fbp ?? '', /^fb\.\d+\.\d+\.\d+/)
assert.equal(first.values._fbc, undefined)
assert.match(first.response.headers.get('cache-control') ?? '', /no-store/)
assert.notEqual(first.response.headers.get('x-vercel-cache'), 'HIT')
const isolated = await read('/produkter')
assert.notEqual(isolated.values._fbp, first.values._fbp)
const cookie = `_fbp=${first.values._fbp}`
const repeated = await read('/produkter', cookie)
assert.equal(repeated.values._fbp, undefined)
assert.equal(repeated.values._fbc, undefined)

const click = await read('/produkter?fbclid=Proxy-HTTP-Verification', cookie)
assert.equal(click.response.status, 200)
assert.equal(click.values._fbc?.split('.')[3], 'Proxy-HTTP-Verification')
assert.equal(click.values._fbp, undefined)
assert.match(click.setCookies.find(value => value.startsWith('_fbc=')) ?? '', /Max-Age=7776000/i)
const completeCookie = `${cookie}; _fbc=${click.values._fbc}`
const sameClick = await read('/produkter?fbclid=Proxy-HTTP-Verification', completeCookie)
assert.equal(sameClick.values._fbc, undefined)
assert.equal(sameClick.values._fbp, undefined)

const duplicates = await read('/produkter?fbclid=First-HTTP-Click&fbclid=Second-HTTP-Click', completeCookie)
assert.equal(duplicates.values._fbc?.split('.')[3], 'First-HTTP-Click')
const repeatedDuplicates = await read('/produkter?fbclid=First-HTTP-Click&fbclid=Second-HTTP-Click', `${cookie}; _fbc=${duplicates.values._fbc}`)
assert.equal(repeatedDuplicates.values._fbc, undefined)
assert.equal(repeatedDuplicates.values._fbp, undefined)

for (const [path, referer] of [
  ['/?fbclid=Proxy-Redirect-Verification', 'https://nbocc.no/'],
  ['/magasinet/artikkel?fbclid=Proxy-Redirect-Verification', ''],
  ['/skreddersy-varmen/layout/legacy?fbclid=Proxy-Redirect-Verification', '']
]) {
  const result = await read(path, completeCookie, referer ? { referer } : {})
  assert.equal(result.response.status, 307)
  assert.equal(result.values._fbc?.split('.')[3], 'Proxy-Redirect-Verification')
  assert.equal(result.values._fbp, undefined)
  assert.match(result.response.headers.get('cache-control') ?? '', /no-store/)
}
const prefetch = await read('/produkter', undefined, { 'next-router-prefetch': '1' })
assert.equal(prefetch.values._fbp, undefined)
assert.equal(prefetch.values._fbc, undefined)
console.log(JSON.stringify({
  ok: true, origin: origin.origin,
  checks: ['initial_capture', 'isolated_browser_ids', 'no_repeat_write', 'new_click', 'same_click', 'repeated_query_keys', 'three_redirects', 'prefetch_excluded', 'internal_headers_not_exposed'],
  browserJavaScriptExecuted: false,
  eventsSubmitted: false
}, null, 2))
