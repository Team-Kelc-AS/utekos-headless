import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldLogCspReport } from './shouldLogCspReport'

test('logs report-only violations only on the production storefront host', () => {
  assert.equal(
    shouldLogCspReport({
      directive: 'script-src-elem',
      blockedHost: 'connect.facebook.net',
      documentHost: 'utekos.no',
      disposition: 'report'
    }),
    true
  )
  assert.equal(
    shouldLogCspReport({
      directive: 'connect-src',
      blockedHost: 'utekos.no',
      documentHost: 'www.utekos.no',
      disposition: 'report'
    }),
    true
  )
})

test('does not log first-party origin mismatches on Vercel deployment hosts', () => {
  assert.equal(
    shouldLogCspReport({
      directive: 'script-src-elem',
      blockedHost: 'utekos.no',
      documentHost:
        'utekos-headless-dfhgf53zq-utekos-marketing-group.vercel.app',
      disposition: 'report'
    }),
    false
  )
})
