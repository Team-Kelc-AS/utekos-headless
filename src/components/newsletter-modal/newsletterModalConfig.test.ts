import assert from 'node:assert/strict'
import test from 'node:test'

import { isNewsletterModalExcludedPath } from './newsletterModalConfig'

test('excludes privacy routes from the newsletter modal', () => {
  assert.equal(isNewsletterModalExcludedPath('/personvern'), true)
  assert.equal(
    isNewsletterModalExcludedPath('/personvern/underdel'),
    true
  )
})

test('keeps the newsletter modal enabled on eligible routes', () => {
  assert.equal(isNewsletterModalExcludedPath('/'), false)
  assert.equal(isNewsletterModalExcludedPath('/produkter'), false)
  assert.equal(isNewsletterModalExcludedPath(null), false)
})
