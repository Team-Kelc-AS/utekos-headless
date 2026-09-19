import assert from 'node:assert/strict'
import test from 'node:test'
import * as mini from '@/lib/validation/zodMini'
import { z as classic } from 'zod'
import { describeUnhandledRejection } from './describeUnhandledRejection'

test('classic and Mini parse errors retain the same safe telemetry classification', () => {
  for (const schema of [classic.string(), mini.string()]) {
    const result = schema.safeParse(42)
    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.error instanceof Error)
    assert.deepEqual(
      describeUnhandledRejection(result.error, undefined),
      {
        reasonType: 'object',
        reasonIsError: true,
        errorName: 'ZodError'
      }
    )
  }
})
