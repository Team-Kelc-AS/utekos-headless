import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { MissingCartIdError } from '@/lib/errors/MissingCartIdError'
import { requireCartId } from './requireCartId'

describe('requireCartId', () => {
  it('returns an existing cart ID', () => {
    assert.equal(requireCartId('gid://shopify/Cart/test'), 'gid://shopify/Cart/test')
  })

  it('throws MissingCartIdError when no cart exists', () => {
    assert.throws(() => requireCartId(null), MissingCartIdError)
  })
})
