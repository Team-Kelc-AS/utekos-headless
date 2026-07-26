import assert from 'node:assert/strict'
import test from 'node:test'
import { captureMetaDatasetQualityCheckIn } from './metaDatasetQualitySentryMonitor'

test('uses independent UTC monitor schedules for primary and retry runs', async () => {
  const captures: unknown[] = []

  await captureMetaDatasetQualityCheckIn(
    { runKind: 'primary', status: 'in_progress' },
    {
      captureCheckIn: (checkIn, monitorConfig) => {
        captures.push({ checkIn, monitorConfig })
        return 'primary-id'
      },
      flush: async () => true
    }
  )
  await captureMetaDatasetQualityCheckIn(
    { runKind: 'retry', status: 'in_progress' },
    {
      captureCheckIn: (checkIn, monitorConfig) => {
        captures.push({ checkIn, monitorConfig })
        return 'retry-id'
      },
      flush: async () => true
    }
  )

  assert.deepEqual(captures, [
    {
      checkIn: {
        monitorSlug: 'utekos-meta-dataset-quality-primary',
        status: 'in_progress'
      },
      monitorConfig: {
        checkinMargin: 5,
        maxRuntime: 1,
        schedule: { type: 'crontab', value: '17 3 * * *' },
        timezone: 'UTC'
      }
    },
    {
      checkIn: {
        monitorSlug: 'utekos-meta-dataset-quality-retry',
        status: 'in_progress'
      },
      monitorConfig: {
        checkinMargin: 5,
        maxRuntime: 1,
        schedule: { type: 'crontab', value: '17 4 * * *' },
        timezone: 'UTC'
      }
    }
  ])
})

test('finishes a check-in with the original id and a bounded flush', async () => {
  const captures: unknown[] = []
  const flushes: number[] = []

  await captureMetaDatasetQualityCheckIn(
    {
      checkInId: 'check-in-id',
      runKind: 'retry',
      status: 'ok'
    },
    {
      captureCheckIn: checkIn => {
        captures.push(checkIn)
        return 'ignored'
      },
      flush: async timeout => {
        assert.equal(timeout, 1_500)
        flushes.push(timeout ?? -1)
        return true
      }
    }
  )

  assert.deepEqual(captures, [
    {
      checkInId: 'check-in-id',
      monitorSlug: 'utekos-meta-dataset-quality-retry',
      status: 'ok'
    }
  ])
  assert.deepEqual(flushes, [1_500])
})
