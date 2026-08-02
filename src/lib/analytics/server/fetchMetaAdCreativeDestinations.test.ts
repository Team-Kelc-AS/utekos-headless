import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchMetaAdCreativeDestinations } from './fetchMetaAdCreativeDestinations'
import type { MetaGraphFetch } from './fetchMetaGraphJson'

test('paginates account ads and reads each creative without token URLs', async () => {
  const requests: Array<{ init: RequestInit; url: URL }> = []
  const responses = [
    {
      data: [
        {
          created_time: '2026-07-01T00:00:00+0000',
          creative: { id: '111111111111' },
          effective_status: 'ACTIVE',
          id: '120246830675150788',
          updated_time: '2026-07-31T00:00:00+0000'
        }
      ],
      paging: { cursors: { after: 'next-page' } }
    },
    {
      data: [
        {
          created_time: '2026-07-02T00:00:00+0000',
          creative: { id: '222222222222' },
          effective_status: 'PAUSED',
          id: '120246491016410788',
          updated_time: '2026-07-28T13:59:00+0000'
        }
      ]
    },
    {
      asset_feed_spec: {
        link_urls: [
          { website_url: 'https://utekos.no/comfyrobe' }
        ]
      },
      id: '111111111111'
    },
    {
      id: '222222222222',
      object_story_spec: {
        link_data: {
          link: 'https://utekos.no/skreddersy-varmen'
        }
      }
    }
  ]
  const fetchImplementation: MetaGraphFetch = async (
    value,
    init
  ) => {
    requests.push({ init, url: new URL(value) })
    const body = responses.shift()
    assert.ok(body)
    return { json: async () => body, ok: true, status: 200 }
  }

  const destinations = await fetchMetaAdCreativeDestinations(
    {
      accessToken: 'secret-token',
      accountId: '772268237116474'
    },
    fetchImplementation
  )

  assert.equal(destinations.length, 2)
  assert.deepEqual(
    destinations.map(destination => destination.destinationUrl),
    [
      'https://utekos.no/comfyrobe',
      'https://utekos.no/skreddersy-varmen'
    ]
  )
  assert.equal(requests.length, 4)
  assert.equal(
    requests[1]?.url.searchParams.get('after'),
    'next-page'
  )
  assert.ok(
    requests.every(
      request =>
        !request.url.searchParams.has('access_token') &&
        request.init.headers &&
        (request.init.headers as Record<string, string>)
          .authorization === 'Bearer secret-token'
    )
  )
})

test('fails closed when Meta returns no ads', async () => {
  await assert.rejects(
    fetchMetaAdCreativeDestinations(
      {
        accessToken: 'secret-token',
        accountId: '772268237116474'
      },
      async () => ({
        json: async () => ({ data: [] }),
        ok: true,
        status: 200
      })
    ),
    /no ads/
  )
})
