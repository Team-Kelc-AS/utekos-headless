import assert from 'node:assert/strict'
import test from 'node:test'
import { DunWaitlistPageSchema } from './DunWaitlistPageSchema'

test('accepts email and mobile number without a name', () => {
  const result = DunWaitlistPageSchema.safeParse({
    email: 'kari@example.com',
    phone: '+47 400 00 000',
    website: ''
  })

  assert.equal(result.success, true)
})

test('rejects a missing or invalid email and mobile number', () => {
  const result = DunWaitlistPageSchema.safeParse({
    email: 'ikke-epost',
    phone: 'abc',
    website: ''
  })

  assert.equal(result.success, false)
  if (!result.success) {
    const paths = result.error.issues.map(issue => issue.path[0])
    assert.equal(paths.includes('email'), true)
    assert.equal(paths.includes('phone'), true)
  }
})
