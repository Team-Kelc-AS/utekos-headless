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

test('Meta Dataset Quality warning accepts only PII-free snapshot fields', () => {
  const parsed = appLogInputSchema.parse({
    context: {},
    data: {
      datasetId: '1092362672918571',
      missingRequiredEvents: ['Lead'],
      snapshotDate: '2026-07-24'
    },
    event: 'meta_dataset_quality.incomplete',
    level: 'WARN'
  })

  assert.deepEqual(parsed.data, {
    datasetId: '1092362672918571',
    missingRequiredEvents: ['Lead'],
    snapshotDate: '2026-07-24'
  })

  assert.equal(
    appLogInputSchema.safeParse({
      ...parsed,
      data: {
        ...parsed.data,
        email: 'customer@example.no'
      }
    }).success,
    false
  )
})
