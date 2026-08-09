import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NEWSLETTER_MODAL_ENABLED,
  isNewsletterModalExcludedPath
} from './newsletterModalConfig'

test('keeps the newsletter modal paused', () => {
  assert.equal(NEWSLETTER_MODAL_ENABLED, false)
})

test('excludes privacy routes from the newsletter modal', () => {
  assert.equal(isNewsletterModalExcludedPath('/personvern'), true)
  assert.equal(
    isNewsletterModalExcludedPath('/personvern/underdel'),
    true
  )
})

test('excludes product and campaign routes from the newsletter modal', () => {
  assert.equal(isNewsletterModalExcludedPath('/produkter'), true)
  assert.equal(
    isNewsletterModalExcludedPath('/produkter/utekos-techdown'),
    true
  )
  assert.equal(isNewsletterModalExcludedPath('/skreddersy-varmen'), true)
  assert.equal(
    isNewsletterModalExcludedPath('/skreddersy-varmen/variant'),
    true
  )
  assert.equal(isNewsletterModalExcludedPath('/comfyrobe'), true)
  assert.equal(isNewsletterModalExcludedPath('/comfyrobe/variant'), true)
})

test('keeps eligible routes available for a future resume', () => {
  assert.equal(isNewsletterModalExcludedPath('/'), false)
  assert.equal(isNewsletterModalExcludedPath('/magasinet'), false)
  assert.equal(isNewsletterModalExcludedPath(null), false)
})
