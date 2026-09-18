import assert from 'node:assert/strict'
import test from 'node:test'

import { createKlarnaFeedLoader } from './getKlarnaFeed'

test('shares one Shopify catalog request between concurrent Klarna feed calls', async () => {
  let loadCount = 0
  const expectedFeed = {
    xml: '<products />',
    lastModified: '2026-09-18T05:33:03.000Z'
  }
  let resolveFeed:
    | ((feed: typeof expectedFeed) => void)
    | undefined
  const feedPromise = new Promise<typeof expectedFeed>(
    resolve => {
      resolveFeed = resolve
    }
  )
  const getKlarnaFeed = createKlarnaFeedLoader(async () => {
    loadCount += 1
    return feedPromise
  })

  const firstRequest = getKlarnaFeed()
  const secondRequest = getKlarnaFeed()

  assert.equal(firstRequest, secondRequest)
  assert.equal(loadCount, 1)

  resolveFeed?.(expectedFeed)

  assert.equal(await firstRequest, expectedFeed)
  assert.equal(await secondRequest, expectedFeed)
})

test('starts a new Klarna feed request after the previous request settles', async () => {
  let loadCount = 0
  const getKlarnaFeed = createKlarnaFeedLoader(async () => {
    loadCount += 1
    return {
      xml: '<products />',
      lastModified: '2026-09-18T05:33:03.000Z'
    }
  })

  await getKlarnaFeed()
  await getKlarnaFeed()

  assert.equal(loadCount, 2)
})
