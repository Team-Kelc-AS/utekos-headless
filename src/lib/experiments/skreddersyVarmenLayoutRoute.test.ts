import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSkreddersyVarmenPublicPathname } from './skreddersyVarmenLayoutRoute'

test('keeps navigation state identical before and after hydration of rewritten layouts', () => {
  for (const path of [
    '/skreddersy-varmen',
    '/skreddersy-varmen/layout/current',
    '/skreddersy-varmen/layout/legacy'
  ]) {
    assert.equal(
      resolveSkreddersyVarmenPublicPathname(path),
      '/skreddersy-varmen'
    )
  }

  for (const path of [
    '/',
    '/produkter',
    '/skreddersy-varmen/utekos-orginal',
    '/skreddersy-varmen/layout/unknown'
  ]) {
    assert.equal(
      resolveSkreddersyVarmenPublicPathname(path),
      path
    )
  }
})
