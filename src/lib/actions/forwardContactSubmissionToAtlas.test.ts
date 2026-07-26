import assert from 'node:assert/strict'
import test from 'node:test'
import { isCustomerServiceAtlasIngestEnabled } from './forwardContactSubmissionToAtlas'

test('Atlas contact ingestion is disabled by default and fails closed', () => {
  assert.equal(isCustomerServiceAtlasIngestEnabled(undefined), false)
  assert.equal(isCustomerServiceAtlasIngestEnabled(''), false)
  assert.equal(isCustomerServiceAtlasIngestEnabled('TRUE'), false)
  assert.equal(isCustomerServiceAtlasIngestEnabled('1'), false)
  assert.equal(isCustomerServiceAtlasIngestEnabled('false'), false)
})

test('Atlas contact ingestion requires the exact true flag', () => {
  assert.equal(isCustomerServiceAtlasIngestEnabled('true'), true)
})
