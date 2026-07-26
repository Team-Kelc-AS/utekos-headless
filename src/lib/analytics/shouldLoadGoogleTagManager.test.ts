import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldLoadGoogleTagManager } from './shouldLoadGoogleTagManager'

test('loads GTM in Vercel production and preview environments', () => {
  assert.equal(shouldLoadGoogleTagManager('production'), true)
  assert.equal(shouldLoadGoogleTagManager('preview'), true)
})

test('does not load live GTM outside a Vercel deployment', () => {
  assert.equal(shouldLoadGoogleTagManager('development'), false)
  assert.equal(shouldLoadGoogleTagManager('test'), false)
  assert.equal(shouldLoadGoogleTagManager(undefined), false)
})
