import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMetaCatalogMediaBlobPathname } from './buildMetaCatalogMediaBlobPathname'

test('builds a content-addressed Meta catalog image pathname', () => {
  assert.equal(
    buildMetaCatalogMediaBlobPathname({
      aspectRatio: '4:5',
      contentHash:
        '8f31c92a1d42a36e25dfbb1987c80240917a30d7314d01e7d3a7d8309f892471',
      fileName: 'TechDown Havdyp – Cover.png',
      format: 'png',
      productHandle: 'utekos-techdown'
    }),
    'meta/catalog/v26/utekos-techdown/4x5/techdown-havdyp-cover-8f31c92a1d42.png'
  )
})

test('uses a canonical jpg extension for jpeg content', () => {
  assert.equal(
    buildMetaCatalogMediaBlobPathname({
      aspectRatio: '9:16',
      contentHash: 'a'.repeat(64),
      fileName: 'STORY.JPEG',
      format: 'jpeg',
      productHandle: 'utekos-techdown'
    }),
    'meta/catalog/v26/utekos-techdown/9x16/story-aaaaaaaaaaaa.jpg'
  )
})

test('keeps non-placement catalog primary images in the original directory', () => {
  assert.equal(
    buildMetaCatalogMediaBlobPathname({
      aspectRatio: 'original',
      contentHash: 'b'.repeat(64),
      fileName: 'Comfy Robe Primary.png',
      format: 'png',
      productHandle: 'comfyrobe'
    }),
    'meta/catalog/v26/comfyrobe/original/comfy-robe-primary-bbbbbbbbbbbb.png'
  )
})
