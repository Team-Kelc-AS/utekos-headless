import assert from 'node:assert/strict'
import test from 'node:test'
import {
  captureMetaAdDeliveryInsightsCheckIn,
  META_AD_DELIVERY_INSIGHTS_CRON_SCHEDULE
} from './metaAdDeliveryInsightsSentryMonitor'

test('uses the Vercel UTC schedule for Meta delivery check-ins', async () => {
  const captures: unknown[] = []

  await captureMetaAdDeliveryInsightsCheckIn(
    { status: 'in_progress' },
    {
      captureCheckIn: (checkIn, monitorConfig) => {
        captures.push({ checkIn, monitorConfig })
        return 'check-in-id'
      },
      flush: async () => true
    }
  )

  assert.deepEqual(captures, [
    {
      checkIn: {
        monitorSlug: 'utekos-meta-ad-delivery-insights',
        status: 'in_progress'
      },
      monitorConfig: {
        checkinMargin: 10,
        maxRuntime: 1,
        schedule: {
          type: 'crontab',
          value: META_AD_DELIVERY_INSIGHTS_CRON_SCHEDULE
        },
        timezone: 'UTC'
      }
    }
  ])
})

test('finishes the exact check-in and performs a bounded flush', async () => {
  const captures: unknown[] = []

  await captureMetaAdDeliveryInsightsCheckIn(
    { checkInId: 'check-in-id', status: 'ok' },
    {
      captureCheckIn: checkIn => {
        captures.push(checkIn)
        return 'ignored'
      },
      flush: async timeout => {
        assert.equal(timeout, 1_500)
        return true
      }
    }
  )

  assert.deepEqual(captures, [
    {
      checkInId: 'check-in-id',
      monitorSlug: 'utekos-meta-ad-delivery-insights',
      status: 'ok'
    }
  ])
})
