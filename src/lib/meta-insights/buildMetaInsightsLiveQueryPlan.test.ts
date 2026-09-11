import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildMetaInsightsBatchOperations,
  metaInsightsBatchLimit
} from './buildMetaInsightsBatchOperations'
import { buildMetaInsightsFollowUpOperations } from './buildMetaInsightsFollowUpOperations'
import { buildMetaInsightsLiveQueryPlan } from './buildMetaInsightsLiveQueryPlan'
import { buildMetaInsightsLiveSnapshot } from './buildMetaInsightsLiveSnapshot'
import { chunkMetaInsightsBatchOperations } from './chunkMetaInsightsBatchOperations'
import { collectMetaInsightsAudienceIds } from './collectMetaInsightsAudienceIds'
import { fetchMetaInsightsGraphBatch } from './fetchMetaInsightsGraphBatch'
import {
  metaInsightsBreakdownSlices,
  metaInsightsForbiddenQueries,
  metaInsightsSliceUsesType1
} from './metaInsightsBreakdownCatalog'
import { metaInsightsFieldPacks } from './metaInsightsFieldPacks'
import { metaInsightsLiveWatch } from './metaInsightsLiveWatch'
import { parseMetaInsightsTargeting } from './parseMetaInsightsTargeting'
import { pickMetaInsightsFunnel } from './pickMetaInsightsFunnel'
import { slimMetaInsightsLiveSnapshot } from './slimMetaInsightsLiveSnapshot'
import { summarizeMetaInsightsActions } from './summarizeMetaInsightsActions'

const oneAdSetWatch = {
  accountId: '772268237116474',
  pixelId: '1092362672918571',
  adSets: [
    {
      key: 'atc',
      adSetId: '120247594128070788',
      campaignId: '120247594128080788'
    }
  ]
}

test('live plan chunks stay under the Graph batch cap and uses date_preset today', () => {
  const plan = buildMetaInsightsLiveQueryPlan(
    metaInsightsLiveWatch
  )
  const operations = buildMetaInsightsBatchOperations(plan)
  for (const chunk of chunkMetaInsightsBatchOperations(operations)) {
    assert.equal(chunk.length <= metaInsightsBatchLimit, true)
  }
  assert.equal(plan.some(query => query.name === 'insights:copy:ads'), true)
  assert.equal(
    plan
      .filter(query => query.edge === 'insights')
      .every(query => query.datePreset === 'today'),
    true
  )
})

test('live insights never use forbidden or Type 1 conversion packs', () => {
  const plan = buildMetaInsightsLiveQueryPlan(
    metaInsightsLiveWatch
  )
  for (const query of plan) {
    const breakdowns = query.breakdowns ?? []
    assert.equal(
      metaInsightsForbiddenQueries.some(
        item =>
          item.breakdowns.length === breakdowns.length &&
          item.breakdowns.every(
            (value, index) => value === breakdowns[index]
          )
      ),
      false
    )
    if (metaInsightsSliceUsesType1(breakdowns)) {
      assert.equal(query.pack, 'delivery')
      assert.equal(query.fields, metaInsightsFieldPacks.delivery)
    }
  }
})

test('deferred slices stay out of the live plan', () => {
  const liveIds = new Set(
    buildMetaInsightsLiveQueryPlan(oneAdSetWatch)
      .filter(query => query.name.startsWith('insights:'))
      .map(query => query.name.split(':')[2])
  )
  for (const slice of metaInsightsBreakdownSlices) {
    if (slice.cadence === 'live')
      assert.equal(liveIds.has(slice.id), true)
    if (slice.cadence === 'deferred') {
      assert.equal(liveIds.has(slice.id), false)
    }
  }
})

test('batch relative URLs are unversioned and never carry tokens', () => {
  const operations = buildMetaInsightsBatchOperations(
    buildMetaInsightsLiveQueryPlan(oneAdSetWatch)
  )
  for (const operation of operations) {
    assert.doesNotMatch(operation.relative_url, /^v26\.0\//)
    assert.doesNotMatch(operation.relative_url, /token/i)
  }
  const totals = operations.find(
    operation => operation.name === 'insights:atc:totals'
  )
  assert.equal(
    totals?.relative_url.includes('date_preset=today'),
    true
  )
  assert.equal(
    totals?.relative_url.includes('breakdowns='),
    false
  )
  const web = operations.find(
    operation => operation.name === 'stats:h1_web'
  )
  assert.equal(
    web?.relative_url.includes('aggregation=event'),
    true
  )
  assert.equal(
    web?.relative_url.includes('event_source=WEB_ONLY'),
    true
  )
  assert.equal(
    web?.relative_url.includes('event_total_counts'),
    false
  )
})

test('batch operations chunk at 50', () => {
  const operations = Array.from({ length: 51 }, (_, index) => ({
    name: `q${index}`,
    method: 'GET' as const,
    relative_url: `v26.0/${index}`
  }))
  const chunks = chunkMetaInsightsBatchOperations(operations)
  assert.equal(chunks.length, 2)
  assert.equal(chunks[0]?.length, 50)
  assert.equal(chunks[1]?.length, 1)
})

test('action summarizer keeps funnel types and prefers omni', () => {
  const actions = summarizeMetaInsightsActions([
    { action_type: 'landing_page_view', value: '2' },
    { action_type: 'omni_landing_page_view', value: '4' },
    { action_type: 'comment', value: '9' }
  ])
  assert.deepEqual(pickMetaInsightsFunnel(actions), {
    landingPageViews: 4,
    addToCart: 0,
    initiateCheckout: 0,
    purchase: 0
  })
})

test('snapshot maps a mock Graph batch without putting tokens in the request', async () => {
  const operations = buildMetaInsightsBatchOperations(
    buildMetaInsightsLiveQueryPlan(oneAdSetWatch)
  )
  const bodies: Record<string, unknown> = {
    'account': {
      id: 'act_772268237116474',
      timezone_name: 'America/Los_Angeles',
      timezone_offset_hours_utc: '-7'
    },
    'campaign:atc': {
      id: '120247594128080788',
      effective_status: 'ACTIVE'
    },
    'adset:atc': {
      id: '120247594128070788',
      optimization_goal: 'ADD_TO_CART',
      learning_stage_info: { status: 'LEARNING', conversions: 0 }
    },
    'ads:atc': {
      data: [
        { id: '1', status: 'ACTIVE', effective_status: 'ACTIVE' }
      ]
    },
    'recommendations': { data: [] },
    'customconversions': { data: [] },
    'sentences:atc': { targetingsentencelines: [] }
  }
  for (const operation of operations) {
    if (operation.name.startsWith('insights:')) {
      bodies[operation.name] = {
        data: [
          {
            spend: '10.5',
            impressions: '100',
            clicks: '4',
            cpm: '105',
            actions: [
              { action_type: 'omni_add_to_cart', value: '2' }
            ],
            rule_set_id: '-1',
            rule_set_name: 'Uncategorized'
          }
        ]
      }
    }
    if (operation.name.startsWith('stats:')) {
      bodies[operation.name] = {
        data: [
          {
            aggregation: 'event_total_counts',
            data: [{ value: 'AddToCart', count: 2 }]
          }
        ]
      }
    }
  }

  const calls: string[] = []
  const snapshot = buildMetaInsightsLiveSnapshot({
    fetchedAt: new Date('2026-09-10T13:00:00.000Z'),
    quality: {
      web: [
        {
          event_name: 'Purchase',
          event_match_quality: { composite_score: 6.2 },
          data_freshness: { upload_frequency: 'real_time' }
        }
      ]
    },
    throttle: '{"acc_id_util_pct":4}',
    watch: oneAdSetWatch,
    items: await (async () => {
      const batch = await fetchMetaInsightsGraphBatch(
        'secret-token',
        operations,
        async (url, init) => {
          calls.push(url)
          assert.equal(url.includes('secret-token'), false)
          assert.equal(
            (init.headers as Record<string, string>)
              .authorization,
            'Bearer secret-token'
          )
          const encoded =
            init.body instanceof URLSearchParams ?
              init.body.get('batch')
            : new URLSearchParams(String(init.body)).get('batch')
          const requested = JSON.parse(
            encoded ?? '[]'
          ) as Array<{ name: string }>
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'x-fb-ads-insights-throttle':
                '{"acc_id_util_pct":4}'
            }),
            json: async () =>
              requested.map(item => ({
                code: 200,
                body: JSON.stringify(bodies[item.name])
              }))
          }
        }
      )
      return batch.items
    })()
  })

  assert.equal(calls[0], 'https://graph.facebook.com/v26.0')
  assert.equal(
    snapshot.adSets.atc?.insights.totals[0]?.addToCart,
    2
  )
  assert.equal(snapshot.pixelStats.h1.AddToCart, 2)
  assert.equal(
    snapshot.adSets.atc?.insights.ads[0]?.addToCart,
    2
  )
  assert.equal(snapshot.customConversions.length, 0)
  const slim = slimMetaInsightsLiveSnapshot(snapshot)
  assert.equal(slim.adSets.atc?.spend, 10.5)
  assert.equal(Array.isArray(slim.adSets.atc?.placements), true)
  assert.equal(Array.isArray(slim.adSets.atc?.ageGender), true)
  assert.equal(slim.pixelStats.h1.AddToCart, 2)
})

test('keeps event health available when supplemental ad reads are throttled', () => {
  const items = buildMetaInsightsLiveQueryPlan(
    oneAdSetWatch
  ).map(query => {
    let body: unknown = { data: [] }

    if (query.name === 'account') {
      body = {
        id: 'act_772268237116474',
        timezone_name: 'America/Los_Angeles',
        timezone_offset_hours_utc: '-7'
      }
    } else if (query.name === 'campaign:atc') {
      body = { id: 'campaign', effective_status: 'ACTIVE' }
    } else if (query.name === 'adset:atc') {
      body = {
        id: 'adset',
        effective_status: 'ACTIVE',
        optimization_goal: 'OFFSITE_CONVERSIONS'
      }
    }

    if (query.name === 'ads:atc') {
      return {
        name: query.name,
        code: 400,
        body: {
          error: {
            code: 17,
            message: 'User request limit reached'
          }
        }
      }
    }

    return { name: query.name, code: 200, body }
  })

  const snapshot = buildMetaInsightsLiveSnapshot({
    fetchedAt: new Date('2026-09-10T13:00:00.000Z'),
    items,
    quality: { web: [{ event_name: 'PageView' }] },
    throttle: null,
    watch: oneAdSetWatch
  })

  assert.deepEqual(snapshot.adSets.atc?.ads, [])
  assert.deepEqual(snapshot.followUpErrors, [
    'ads:atc: User request limit reached'
  ])
  assert.equal(snapshot.quality.web[0]?.event_name, 'PageView')
})

test('conversion pack fills the verified Insights field set', () => {
  assert.equal(
    metaInsightsFieldPacks.conversion.split(',').length >= 40,
    true
  )
})

test('live plan fills the Graph batch with sentences, custom conversions and ad Insights', () => {
  const plan = buildMetaInsightsLiveQueryPlan(
    metaInsightsLiveWatch,
    new Date('2026-09-10T13:00:00.000Z')
  )
  const names = plan.map(query => query.name)
  assert.equal(names.includes('insights:copy:totals'), true)
  assert.equal(names.includes('insights:copy:ads'), true)
  assert.equal(names.includes('stats:m15'), true)
  assert.equal(names.includes('stats:h1'), true)
  assert.equal(names.includes('stats:h1_web'), true)
  assert.equal(names.includes('stats:h1_server'), true)
  assert.equal(names.includes('stats:h24'), true)
  assert.equal(names.includes('recommendations'), true)
  assert.equal(names.includes('customconversions'), true)
  assert.equal(names.includes('sentences:atc'), true)
  assert.equal(
    plan.some(query => query.level === 'ad'),
    true
  )
  assert.equal(
    metaInsightsFieldPacks.conversionTotals.includes(
      'unique_clicks'
    ),
    true
  )
})

test('targeting parser reads Advantage+ audience and lookalike inclusions', () => {
  const targeting = parseMetaInsightsTargeting({
    age_min: 18,
    age_max: 65,
    age_range: [40, 65],
    geo_locations: { countries: ['NO'] },
    custom_audiences: [
      { id: '120247591424900788', name: 'LAL' }
    ],
    targeting_automation: {
      advantage_audience: 1,
      individual_setting: { age: 1, gender: 1 }
    }
  })
  assert.equal(targeting?.advantageAudience, true)
  assert.deepEqual(targeting?.ageRange, [40, 65])
  assert.deepEqual(collectMetaInsightsAudienceIds([targeting]), [
    '120247591424900788'
  ])
  const followUp = buildMetaInsightsFollowUpOperations({
    accountId: '772268237116474',
    adSets: { atc: { targeting } }
  })
  assert.equal(
    followUp.some(
      operation =>
        operation.name === 'audience:120247591424900788'
    ),
    true
  )
  assert.equal(
    followUp.some(
      operation => operation.name === 'reachestimate:atc'
    ),
    true
  )
  assert.equal(
    followUp.every(
      operation => !/token/i.test(operation.relative_url)
    ),
    true
  )
})
