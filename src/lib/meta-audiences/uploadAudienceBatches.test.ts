import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import {
  uploadAudienceBatches,
  type AudienceUploadCheckpoint
} from './uploadAudienceBatches'

const request = {
  audienceId: '123',
  accountId: '456',
  permissionEvidence: 'synthetic-test-only',
  authorized: true,
  schema: ['PHONE'],
  data: Array.from({ length: 10000 }, (_, i) => [
    createHash('sha256').update(`synthetic-${i}`).digest('hex')
  ]),
  checkpoint: null,
  sessionId: 123456
}

test('upload saves in-flight before each call and keeps receipt distinct from matching', async () => {
  const checkpoints: AudienceUploadCheckpoint[] = [],
    sizes: number[] = []
  const result = await uploadAudienceBatches(request, {
    accessToken: 'test',
    saveCheckpoint: async c => {
      checkpoints.push(c)
    },
    fetcher: async (_url, init) => {
      const body = JSON.parse(String(init?.body))
      sizes.push(body.payload.data.length)
      assert.equal(
        checkpoints.at(-1)?.inFlight,
        body.session.batch_seq
      )
      return Response.json({
        audience_id: '123',
        session_id: 123456,
        num_received: body.payload.data.length,
        num_invalid_entries: 0,
        invalid_entry_samples: ['never retained']
      })
    }
  })
  assert.deepEqual(sizes, [9999, 1])
  assert.equal(result.checkpoint?.acceptedThrough, 2)
  assert.equal(result.matchingVerified, false)
  assert.ok(!JSON.stringify(result).includes('never retained'))
})

test('network interruption leaves an in-flight checkpoint and prevents blind resend', async () => {
  let checkpoint: AudienceUploadCheckpoint | null = null
  await assert.rejects(
    uploadAudienceBatches(request, {
      accessToken: 'test',
      saveCheckpoint: async c => {
        checkpoint = c
      },
      fetcher: async () => {
        throw new Error('connection closed')
      }
    })
  )
  await assert.rejects(
    uploadAudienceBatches(
      { ...request, checkpoint },
      {
        accessToken: 'test',
        saveCheckpoint: async () => {},
        fetcher: async () => {
          throw new Error('must not call')
        }
      }
    ),
    /uncertain/
  )
})

test('resumption cannot switch audience, schema or permission evidence', async () => {
  let checkpoint: AudienceUploadCheckpoint | null = null
  await assert.rejects(
    uploadAudienceBatches(request, {
      accessToken: 'test',
      saveCheckpoint: async c => {
        checkpoint = c
      },
      fetcher: async () => {
        throw new Error('connection closed')
      }
    })
  )
  await assert.rejects(
    uploadAudienceBatches(
      { ...request, audienceId: '789', checkpoint },
      { accessToken: 'test', saveCheckpoint: async () => {} }
    ),
    /contract/
  )
})
