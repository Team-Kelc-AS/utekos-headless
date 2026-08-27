import assert from 'node:assert/strict'
import test from 'node:test'

import robots, { META_WEB_CRAWLER_USER_AGENTS } from './robots'

test('Meta web crawlers may fetch the storefront except cart, account and API', () => {
  const manifest = robots()
  const rules = Array.isArray(manifest.rules)
    ? manifest.rules
    : [manifest.rules]
  const metaRule = rules.find(rule =>
    Array.isArray(rule.userAgent)
      ? rule.userAgent.includes('facebookexternalhit')
      : rule.userAgent === 'facebookexternalhit'
  )

  assert.ok(metaRule, 'robots.txt must declare a Meta crawler group')
  assert.deepEqual(metaRule.userAgent, [...META_WEB_CRAWLER_USER_AGENTS])
  assert.equal(metaRule.allow, '/')
  assert.deepEqual(metaRule.disallow, ['/cart/', '/account/', '/api/'])
  assert.equal(metaRule.crawlDelay, undefined)
  assert.doesNotMatch(
    JSON.stringify(metaRule.disallow),
    /\/videos\//,
    'Meta crawlers must still be allowed to fetch /videos/'
  )
})

test('wildcard crawlers keep cart, account, API and video disallows', () => {
  const manifest = robots()
  const rules = Array.isArray(manifest.rules)
    ? manifest.rules
    : [manifest.rules]
  const wildcard = rules.find(rule => rule.userAgent === '*')

  assert.ok(wildcard)
  assert.deepEqual(wildcard.disallow, [
    '/cart/',
    '/account/',
    '/api/',
    '/videos/'
  ])
})
