import assert from 'node:assert/strict'
import test from 'node:test'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

test('keeps valid device data and omits transient invalid dimensions', () => {
  assert.deepEqual(
    mapEventDeviceInfo({
      language: 'nb-NO',
      pixelRatio: Number.NaN,
      screenHeight: 0,
      screenWidth: 390,
      viewportHeight: 0,
      viewportWidth: 390
    }),
    {
      language: 'nb-NO',
      screen_width: 390,
      viewport_width: 390
    }
  )
})
