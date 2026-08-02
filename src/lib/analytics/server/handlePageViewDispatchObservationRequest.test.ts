import assert from 'node:assert/strict'
import test from 'node:test'
import { handlePageViewDispatchObservationRequest } from './handlePageViewDispatchObservationRequest'
import type { PageViewFunnelObservationStore } from './pageViewFunnelObservationStore'

const endpoint =
  'https://utekos.no/api/observability/page-view-dispatch'
const body = {
  correlation_token:
    '1754029200.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
  edge_request_id: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
  event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
  event_name: 'page_view',
  page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd'
}

function request(
  value: unknown,
  headers: Record<string, string> = {}
) {
  return new Request(endpoint, {
    body:
      typeof value === 'string' ? value : JSON.stringify(value),
    headers: {
      'content-type': 'application/json',
      'origin': 'https://utekos.no',
      ...headers
    },
    method: 'POST'
  })
}

function dependencies(
  recordBrowserDispatch: PageViewFunnelObservationStore['recordBrowserDispatch']
) {
  return {
    classifyTraffic: async () => ({
      classification: 'human_or_unknown' as const,
      excludeFromMarketingDispatch: false
    }),
    store: {
      recordBrowserDispatch,
      recordCollectorReceipt: async () => true
    },
    verifyCorrelation: async () => true
  }
}

test('stores only the correlated UUID identity and traffic class', async () => {
  const rows: Parameters<
    PageViewFunnelObservationStore['recordBrowserDispatch']
  >[0][] = []
  const response =
    await handlePageViewDispatchObservationRequest(
      request(body),
      dependencies(async row => {
        rows.push(row)
        return true
      })
    )

  assert.equal(response.status, 202)
  assert.match(rows[0]?.observedAt ?? '', /^\d{4}-\d{2}-\d{2}T/u)
  assert.deepEqual(rows, [
    {
      edgeRequestId: body.edge_request_id,
      eventId: body.event_id,
      observedAt: rows[0]?.observedAt,
      pageViewId: body.page_view_id,
      trafficClassification: 'human_or_unknown'
    }
  ])
})

test('rejects cross-origin, malformed and unverified receipts', async () => {
  let writes = 0
  const base = dependencies(async () => {
    writes += 1
    return true
  })

  assert.equal(
    (
      await handlePageViewDispatchObservationRequest(
        request(body, { origin: 'https://attacker.example' }),
        base
      )
    ).status,
    403
  )
  assert.equal(
    (
      await handlePageViewDispatchObservationRequest(
        request({ ...body, page_url: 'https://utekos.no/' }),
        base
      )
    ).status,
    400
  )
  assert.equal(
    (
      await handlePageViewDispatchObservationRequest(
        request(body),
        { ...base, verifyCorrelation: async () => false }
      )
    ).status,
    403
  )
  assert.equal(writes, 0)
})

test('returns an idempotent duplicate response', async () => {
  const response =
    await handlePageViewDispatchObservationRequest(
      request(body),
      dependencies(async () => false)
    )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'duplicate'
  })
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
})
