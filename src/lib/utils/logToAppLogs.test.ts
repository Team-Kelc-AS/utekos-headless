import assert from 'node:assert/strict'
import test from 'node:test'
import type { AppLogInput } from '@/lib/observability/logging/appLogContract'
import { logToAppLogs } from './logToAppLogs'

const warning: AppLogInput = {
  context: {},
  data: {
    datasetId: '1092362672918571',
    missingRequiredEvents: ['Lead'],
    snapshotDate: '2026-07-24'
  },
  event: 'meta_dataset_quality.incomplete',
  level: 'WARN'
}

test('reports each validated warning and error exactly once', async t => {
  t.mock.method(console, 'warn', () => undefined)
  t.mock.method(console, 'error', () => undefined)
  const reports: unknown[] = []

  const warningResult = await logToAppLogs(warning, {
    report: async entry => {
      reports.push(entry)
    }
  })
  const errorResult = await logToAppLogs(
    {
      context: {},
      data: { reasonCode: 'network' },
      event: 'contact.exception',
      level: 'ERROR'
    },
    {
      report: async entry => {
        reports.push(entry)
      }
    }
  )

  assert.equal(reports.length, 2)
  assert.equal(reports[0], warningResult)
  assert.equal(reports[1], errorResult)
})

test('returns the same ERROR log entry when reporting delivery fails', async t => {
  t.mock.method(console, 'warn', () => undefined)
  t.mock.method(console, 'error', () => undefined)

  const errorInput: AppLogInput = {
    context: {},
    data: { reasonCode: 'network' },
    event: 'newsletter.exception',
    level: 'ERROR'
  }

  const result = await logToAppLogs(errorInput, {
    report: async () => {
      throw new Error('Sentry unavailable')
    }
  })

  assert.equal(result.event, errorInput.event)
  assert.deepEqual(result.data, errorInput.data)
})
