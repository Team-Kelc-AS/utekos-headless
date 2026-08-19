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

test('writes complete ad-platform event parameters to the runtime log line', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) => {
    lines.push(String(value))
  })

  const result = await logToAppLogs({
    context: {
      pagePath: '/produkter/utekos-techdown',
      requestPath: '/api/events/add-to-cart'
    },
    data: {
      currency: 'NOK',
      durationMs: 12,
      eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      eventName: 'add_to_cart',
      grossValue: 2499,
      itemCount: 1,
      quantity: 1,
      status: 'accepted'
    },
    event: 'commerce.event',
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventName: 'add_to_cart',
    level: 'INFO',
    pageUrl: 'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
    adPlatformEvents: {
      meta: {
        eventName: 'AddToCart',
        requiredParameters: ['event_id', 'currency', 'value', 'user_data'],
        transport: {
          browser: null,
          server: 'meta_conversions_api'
        },
        parameters: {
          action_source: 'website',
          currency: 'NOK',
          event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
          event_source_url:
            'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
          value: 2499
        }
      }
    }
  })

  assert.equal(lines.length, 1)
  const entry = JSON.parse(lines[0] ?? '{}') as {
    adPlatformEvents?: {
      meta?: {
        eventName?: string
        parameters?: Record<string, unknown>
      }
    }
    eventId?: string
    pageUrl?: string
  }

  assert.equal(entry.eventId, result.eventId)
  assert.equal(entry.pageUrl, '/produkter/utekos-techdown')
  assert.equal(entry.adPlatformEvents?.meta?.eventName, 'AddToCart')
  assert.equal(entry.adPlatformEvents?.meta?.parameters?.currency, 'NOK')
  assert.equal(
    entry.adPlatformEvents?.meta?.parameters?.event_source_url,
    '/produkter/utekos-techdown'
  )
  assert.equal(JSON.stringify(entry).includes('fbclid'), false)
  assert.equal(JSON.stringify(entry).includes('secret'), false)
  assert.equal(JSON.stringify(entry).includes('user_data'), true)
})
