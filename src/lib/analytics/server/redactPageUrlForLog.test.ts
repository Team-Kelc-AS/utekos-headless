import assert from 'node:assert/strict'
import test from 'node:test'
import { redactPageUrlForLog } from './redactPageUrlForLog'

test('removes query strings and fragments from absolute PageView URLs', () => {
  assert.equal(
    redactPageUrlForLog(
      'https://utekos.no/skreddersy-varmen?fbclid=AbC-123&utm_source=facebook#bestill'
    ),
    'https://utekos.no/skreddersy-varmen'
  )
})

test('fails closed for malformed PageView URLs', () => {
  assert.equal(
    redactPageUrlForLog('/skreddersy-varmen?secret=value#bestill'),
    '/skreddersy-varmen'
  )
})
