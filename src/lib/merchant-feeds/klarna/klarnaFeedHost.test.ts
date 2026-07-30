import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isKlarnaFeedHost,
  KLARNA_FEED_HOST
} from './klarnaFeedHost'

test('identifies Klarna feed host without path for Klarna form validation', () => {
  assert.equal(KLARNA_FEED_HOST, 'feed.utekos.no')
  assert.equal(isKlarnaFeedHost('feed.utekos.no'), true)
  assert.equal(isKlarnaFeedHost('www.feed.utekos.no'), true)
  assert.equal(isKlarnaFeedHost('FEED.UTEKOS.NO.'), true)
  assert.equal(isKlarnaFeedHost('utekos.no'), false)
  assert.equal(isKlarnaFeedHost('kasse.utekos.no'), false)
})
