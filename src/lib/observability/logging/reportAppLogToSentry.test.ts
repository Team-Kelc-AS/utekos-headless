import assert from 'node:assert/strict'
import test from 'node:test'
import type { AppLogEntry } from 'types/observability/log/AppLogEntry'
import { reportAppLogToSentry } from './reportAppLogToSentry'

const runtime = {
  commitSha: 'commit-sha',
  deploymentId: 'deployment-id',
  environment: 'preview',
  isProductionDeployment: false,
  region: 'arn1'
} as const

test('reports an incomplete Meta snapshot once with warning severity and a deterministic fingerprint', async () => {
  const captures: unknown[] = []
  const flushes: number[] = []
  const logEntry: AppLogEntry = {
    context: { runtime },
    data: {
      datasetId: '1092362672918571',
      missingRequiredEvents: ['Lead'],
      snapshotDate: '2026-07-24'
    },
    event: 'meta_dataset_quality.incomplete',
    id: 'log-id',
    level: 'WARN',
    timestamp: '2026-07-24T04:17:35.000Z'
  }

  await reportAppLogToSentry(logEntry, {
    captureMessage: (message, context) => {
      captures.push({ context, message })
      return 'event-id'
    },
    flush: async timeout => {
      assert.equal(timeout, 1_500)
      flushes.push(timeout ?? -1)
      return true
    },
    getRuntime: () => runtime
  })

  assert.equal(captures.length, 1)
  assert.deepEqual(captures[0], {
    context: {
      extra: {
        ...logEntry,
        commitSha: 'commit-sha'
      },
      fingerprint: [
        'meta_dataset_quality.incomplete',
        '1092362672918571',
        '2026-07-24'
      ],
      level: 'warning',
      tags: {
        app_log_id: 'log-id',
        vercel_deployment_id: 'deployment-id',
        vercel_environment: 'preview',
        vercel_region: 'arn1'
      }
    },
    message: 'meta_dataset_quality.incomplete'
  })
  assert.deepEqual(flushes, [1_500])
  assert.equal(JSON.stringify(captures).includes('customer@example.no'), false)
})

test('keeps generic ERROR reporting behavior unchanged', async () => {
  const captures: unknown[] = []
  const logEntry: AppLogEntry = {
    context: {},
    data: { reasonCode: 'network' },
    event: 'contact.exception',
    id: 'error-log-id',
    level: 'ERROR',
    timestamp: '2026-07-24T04:17:35.000Z'
  }

  await reportAppLogToSentry(logEntry, {
    captureMessage: (message, context) => {
      captures.push({ context, message })
      return 'event-id'
    },
    flush: async () => true,
    getRuntime: () => runtime
  })

  assert.equal(captures.length, 1)
  assert.equal(
    (captures[0] as { context: { level: string } }).context.level,
    'error'
  )
  assert.equal(
    'fingerprint' in (captures[0] as { context: object }).context,
    false
  )
})

test('groups unhandled rejections by safe error name and route and links the detailed client event', async () => {
  const captures: unknown[] = []
  const logEntry: AppLogEntry = {
    context: { route: '/comfyrobe' },
    data: {
      errorName: 'ZodError',
      reasonIsError: true,
      reasonType: 'object',
      sentryEventId: '0123456789abcdef0123456789abcdef',
      source: 'unhandled_rejection'
    },
    event: 'client.unhandled_rejection',
    id: 'client-log-id',
    level: 'ERROR',
    timestamp: '2026-08-30T08:52:14.709Z'
  }

  await reportAppLogToSentry(logEntry, {
    captureMessage: (message, context) => {
      captures.push({ context, message })
      return 'generic-event-id'
    },
    flush: async () => true,
    getRuntime: () => runtime
  })

  const capture = captures[0] as {
    context: {
      fingerprint: string[]
      tags: Record<string, string>
    }
  }
  assert.deepEqual(capture.context.fingerprint, [
    'client.unhandled_rejection',
    'ZodError',
    '/comfyrobe'
  ])
  assert.equal(capture.context.tags.client_error_name, 'ZodError')
  assert.equal(
    capture.context.tags.client_sentry_event_id,
    '0123456789abcdef0123456789abcdef'
  )
})

test('forwards complete ad-platform event parameters in Sentry extra', async () => {
  const captures: unknown[] = []
  const logEntry: AppLogEntry = {
    adPlatformEvents: {
      google: {
        eventName: 'add_to_cart',
        parameters: {
          currency: 'NOK',
          event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
          value: 2499
        },
        requiredParameters: ['event_id', 'currency', 'value'],
        transport: {
          browser: 'google_tag_manager',
          server: 'google_data_manager'
        }
      }
    },
    context: {},
    data: { reasonCode: 'network' },
    event: 'contact.exception',
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventName: 'add_to_cart',
    id: 'error-log-id',
    level: 'ERROR',
    timestamp: '2026-07-24T04:17:35.000Z'
  }

  await reportAppLogToSentry(logEntry, {
    captureMessage: (message, context) => {
      captures.push({ context, message })
      return 'event-id'
    },
    flush: async () => true,
    getRuntime: () => runtime
  })

  const extra = (
    captures[0] as {
      context: { extra: Record<string, unknown> }
    }
  ).context.extra

  assert.deepEqual(extra.adPlatformEvents, logEntry.adPlatformEvents)
  assert.equal(extra.eventId, logEntry.eventId)
  assert.equal(extra.eventName, 'add_to_cart')
  assert.equal(extra.commitSha, 'commit-sha')
  assert.equal(JSON.stringify(extra).includes('customer@example.no'), false)
})
