import assert from 'node:assert/strict'
import test from 'node:test'
import { appLogInputSchema } from './appLogContract'

test('event-specific app log contracts reject customer identifiers', () => {
  const result = appLogInputSchema.safeParse({
    event: 'contact.submitted',
    level: 'INFO',
    data: {
      delivery: 'resend',
      email: 'customer@example.no'
    },
    context: {}
  })

  assert.equal(result.success, false)
})

test('event-specific app log contracts accept minimal operational fields', () => {
  const result = appLogInputSchema.parse({
    event: 'contact.atlas_skipped',
    level: 'INFO',
    data: { reasonCode: 'disabled' },
    context: {}
  })

  assert.deepEqual(result.data, { reasonCode: 'disabled' })
})
