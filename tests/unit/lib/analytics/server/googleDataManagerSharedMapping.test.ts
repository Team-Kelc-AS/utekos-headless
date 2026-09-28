import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mapGoogleDataManagerEventLocation,
  mapGoogleDataManagerTimestamp
} from '@/lib/analytics/server/googleDataManagerSharedMapping'

test('preserves a valid event timestamp that is not in the future', () => {
  const mapped = mapGoogleDataManagerTimestamp(
    '2026-07-18T15:43:13.679Z',
    Date.parse('2026-07-18T15:43:15.000Z')
  )

  assert.deepEqual(mapped, {
    seconds: 1784389393,
    nanos: 679000000
  })
})

test('clamps browser clock skew to the server dispatch time', () => {
  const mapped = mapGoogleDataManagerTimestamp(
    '2026-07-18T15:43:13.679Z',
    Date.parse('2026-07-18T15:43:12.391Z')
  )

  assert.deepEqual(mapped, {
    seconds: 1784389392,
    nanos: 391000000
  })
})

test('keeps country and city without synthesizing a subdivision code', () => {
  const mapped = mapGoogleDataManagerEventLocation({
    location: {
      city: 'Oslo',
      country_code: 'no',
      region_code: '07'
    }
  } as Parameters<typeof mapGoogleDataManagerEventLocation>[0])

  assert.deepEqual(mapped, {
    city: 'Oslo',
    regionCode: 'NO'
  })
})

test('omits an unverified subdivision code even when it looks qualified', () => {
  const mapped = mapGoogleDataManagerEventLocation({
    location: {
      country_code: 'NO',
      region_code: 'NO-07'
    }
  } as Parameters<typeof mapGoogleDataManagerEventLocation>[0])

  assert.deepEqual(mapped, {
    regionCode: 'NO'
  })
})
