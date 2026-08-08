import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyKlarnaAuthorizationResult } from './classifyKlarnaAuthorizationResult'

test('classifies a completed authorization as approved', () => {
  assert.equal(
    classifyKlarnaAuthorizationResult({
      approved: true,
      authorization_token: 'authorization-token'
    }),
    'approved'
  )
})

test('treats a closed or backed-out Klarna flow as a silent dismissal', () => {
  assert.equal(
    classifyKlarnaAuthorizationResult({ approved: false }),
    'dismissed'
  )
})

test('keeps a genuinely unavailable Klarna flow visible', () => {
  assert.equal(
    classifyKlarnaAuthorizationResult({
      approved: false,
      show_form: false
    }),
    'unavailable'
  )
})
