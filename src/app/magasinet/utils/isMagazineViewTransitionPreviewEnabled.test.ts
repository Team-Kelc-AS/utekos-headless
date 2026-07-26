import assert from 'node:assert/strict'
import test from 'node:test'
import { isMagazineViewTransitionPreviewEnabled } from './isMagazineViewTransitionPreviewEnabled'

test('enables the pilot only for an explicit Preview environment', () => {
  assert.equal(
    isMagazineViewTransitionPreviewEnabled({
      VERCEL_ENV: 'preview',
      MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED: '1'
    }),
    true
  )
})

test('keeps production closed even if the pilot variable is set', () => {
  assert.equal(
    isMagazineViewTransitionPreviewEnabled({
      VERCEL_ENV: 'production',
      MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED: '1'
    }),
    false
  )
})

test('fails closed for missing and malformed pilot values', () => {
  assert.equal(
    isMagazineViewTransitionPreviewEnabled({
      VERCEL_ENV: 'preview'
    }),
    false
  )
  assert.equal(
    isMagazineViewTransitionPreviewEnabled({
      VERCEL_ENV: 'preview',
      MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED: 'true'
    }),
    false
  )
})
