import assert from 'node:assert/strict'
import test from 'node:test'

import { BlobNotFoundError } from '@vercel/blob'

import { publishMetaCatalogImage } from './publishMetaCatalogImage'

const pathname =
  'meta/catalog/v26/utekos-techdown/4x5/techdown-cover-8f31c92a1d42.png'
const blob = {
  cacheControl: 'public, max-age=31536000',
  contentDisposition: 'inline',
  contentType: 'image/png',
  downloadUrl: `https://store.public.blob.vercel-storage.com/${pathname}?download=1`,
  etag: 'etag',
  pathname,
  size: 5,
  uploadedAt: new Date('2026-09-04T18:00:00Z'),
  url: `https://store.public.blob.vercel-storage.com/${pathname}`
}

test('publishes an immutable public image when the pathname is new', async () => {
  let receivedOptions: unknown

  const result = await publishMetaCatalogImage({
    body: Buffer.from('image'),
    contentType: 'image/png',
    pathname,
    token: 'token',
    headImpl: async () => {
      throw new BlobNotFoundError()
    },
    putImpl: async (_pathname, _body, options) => {
      receivedOptions = options
      return blob
    }
  })

  assert.equal(result.reused, false)
  assert.deepEqual(receivedOptions, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 31_536_000,
    contentType: 'image/png',
    multipart: false,
    token: 'token'
  })
})

test('reuses an existing content-addressed image without writing', async () => {
  let putCalled = false

  const result = await publishMetaCatalogImage({
    body: Buffer.from('image'),
    contentType: 'image/png',
    pathname,
    token: 'token',
    headImpl: async () => blob,
    putImpl: async () => {
      putCalled = true
      return blob
    }
  })

  assert.equal(result.reused, true)
  assert.equal(putCalled, false)
})
