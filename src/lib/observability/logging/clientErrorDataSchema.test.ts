import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'
import { clientErrorDataSchema } from './clientErrorDataSchema'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'

// Pre-Mini contract: keep this independent of the production schema.
const classicSchema = z.strictObject({
  source: z.literal('window_error'),
  message: z
    .string()
    .min(1)
    .max(240)
    .refine(value => !/\S+@\S+\.\S+/.test(value), {
      message:
        'Client error message must not contain email-like values'
    })
    .optional(),
  filename: z
    .string()
    .min(1)
    .max(512)
    .transform(sanitizeOperationalPathname)
    .optional(),
  line: z
    .number()
    .int()
    .nonnegative()
    .max(10_000_000)
    .optional(),
  column: z
    .number()
    .int()
    .nonnegative()
    .max(10_000_000)
    .optional()
})

test('Mini client error fields preserve classic outputs, issue paths, codes and messages', () => {
  const fixture = {
    source: 'window_error',
    message: 'ChunkLoadError',
    filename:
      'https://utekos.no/_next/static/chunks/app.js?token=private',
    line: 12,
    column: 4
  }
  const values = [
    undefined,
    null,
    '',
    'a@b.no',
    'a'.repeat(240),
    'a'.repeat(241),
    'a'.repeat(512),
    'a'.repeat(513),
    -1,
    0,
    1,
    1.5,
    10_000_000,
    10_000_001,
    Number.MAX_SAFE_INTEGER + 1,
    Infinity,
    NaN,
    false,
    {},
    []
  ]
  const inputs: unknown[] = [
    fixture,
    { source: 'window_error' },
    { ...fixture, stack: 'private' },
    ...values
  ]
  for (const key of Object.keys(fixture)) {
    for (const value of values)
      inputs.push({ ...fixture, [key]: value })
  }
  for (const input of inputs) {
    const expected = classicSchema.safeParse(input)
    const actual = clientErrorDataSchema.safeParse(input)
    assert.equal(actual.success, expected.success)
    if (actual.success && expected.success) {
      assert.deepEqual(actual.data, expected.data)
    } else if (!actual.success && !expected.success) {
      assert.deepEqual(
        actual.error.issues,
        expected.error.issues
      )
    }
  }
})
