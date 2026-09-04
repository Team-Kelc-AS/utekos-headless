import assert from 'node:assert/strict'
import test from 'node:test'

import { validateMetaCatalogImageMetadata } from './validateMetaCatalogImageMetadata'

test('accepts exact high-resolution 4:5 and 9:16 catalog images', () => {
  assert.deepEqual(
    validateMetaCatalogImageMetadata({
      fileName: 'techdown-feed.png',
      format: 'png',
      height: 1800,
      preference: 'feed_4_5',
      sizeBytes: 12_000_000,
      width: 1440
    }),
    {
      aspectRatio: '4:5',
      fileName: 'techdown-feed.png',
      format: 'png',
      height: 1800,
      preference: 'feed_4_5',
      sizeBytes: 12_000_000,
      width: 1440
    }
  )

  assert.equal(
    validateMetaCatalogImageMetadata({
      fileName: 'techdown-reels.jpg',
      format: 'jpeg',
      height: 2560,
      preference: 'reels_9_16',
      sizeBytes: 8_000_000,
      width: 1440
    }).aspectRatio,
    '9:16'
  )
})

test('rejects a file whose name claims 4:5 but dimensions are 1440x1880', () => {
  assert.throws(
    () =>
      validateMetaCatalogImageMetadata({
        fileName: 'TechDown_Frontpage_1_1440x1800.png',
        format: 'png',
        height: 1880,
        preference: 'feed_4_5',
        sizeBytes: 12_000_000,
        width: 1440
      }),
    /must be exact 4:5; received 1440 x 1880/
  )
})

test('requires Meta recommended dimensions for curated placement assets', () => {
  assert.throws(
    () =>
      validateMetaCatalogImageMetadata({
        fileName: 'small-feed.png',
        format: 'png',
        height: 750,
        preference: 'feed_4_5',
        sizeBytes: 1_000_000,
        width: 600
      }),
    /at least 1080 x 1350/
  )

  assert.throws(
    () =>
      validateMetaCatalogImageMetadata({
        fileName: 'small-story.png',
        format: 'png',
        height: 960,
        preference: 'stories_9_16',
        sizeBytes: 1_000_000,
        width: 540
      }),
    /at least 1080 x 1920/
  )
})

test('rejects unsupported formats and files over 30 MB', () => {
  assert.throws(
    () =>
      validateMetaCatalogImageMetadata({
        fileName: 'feed.webp',
        format: 'webp',
        height: 1350,
        preference: 'feed_4_5',
        sizeBytes: 1_000_000,
        width: 1080
      }),
    /must be PNG or JPEG/
  )

  assert.throws(
    () =>
      validateMetaCatalogImageMetadata({
        fileName: 'feed.png',
        format: 'png',
        height: 1350,
        preference: 'feed_4_5',
        sizeBytes: 30 * 1024 * 1024 + 1,
        width: 1080
      }),
    /must not exceed 30 MB/
  )
})
