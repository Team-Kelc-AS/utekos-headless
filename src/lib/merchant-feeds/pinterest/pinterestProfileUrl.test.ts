import assert from 'node:assert/strict'
import test from 'node:test'

import { PINTEREST_PROFILE_URL } from './pinterestProfileUrl'

test('uses the current Pinterest business profile URL', () => {
  assert.equal(
    PINTEREST_PROFILE_URL,
    'https://www.pinterest.com/utekosen'
  )
})
