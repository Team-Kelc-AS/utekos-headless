import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeAudienceIdentity } from './normalizeAudienceIdentity'
import { parseAudienceCsv } from './parseAudienceCsv'
import { auditAudienceSegments } from './auditAudienceSegments'
import { buildTechDownValueRules } from './buildTechDownValueRules'
import { evaluateValueRules } from './evaluateValueRules'
import { buildValueRuleAttachment } from './buildValueRuleAttachment'
import { planAudienceBatches } from './planAudienceBatches'
import { getBuyerExclusions } from './getBuyerExclusions'

test('Norwegian phone normalization is exact and rejects corrupt identifiers', () => {
  assert.equal(
    normalizeAudienceIdentity({ phone: '0047 400 00 001' })
      .phone,
    '4740000001'
  )
  assert.equal(
    normalizeAudienceIdentity({ phone: '+47 40000001' }).phone,
    '4740000001'
  )
  assert.equal(
    normalizeAudienceIdentity({ phone: 'abc40000001' }).phone,
    null
  )
  assert.equal(
    normalizeAudienceIdentity({ email: ' TEST@example.com ' })
      .email,
    'test@example.com'
  )
  assert.equal(
    normalizeAudienceIdentity({ email: 'invalid' }).email,
    null
  )
})

test('CSV accepts BOM, quoted semicolons and CRLF, rejects malformed rows', () => {
  assert.deepEqual(
    parseAudienceCsv(
      '\uFEFFfn;phone\r\n"A; B";004740000001\r\n'
    ),
    [{ fn: 'A; B', phone: '004740000001' }]
  )
  assert.throws(
    () => parseAudienceCsv('phone;email\n123'),
    /column/
  )
  assert.throws(() => parseAudienceCsv('phone\n"123'), /quote/)
})

test('partitions form one segment, buyers across files are excluded; names do not join', () => {
  const result = auditAudienceSegments(
    [
      {
        segment: 'motorhome',
        source: '01',
        rows: [{ phone: '40000001' }, { phone: '40000002' }]
      },
      {
        segment: 'motorhome',
        source: '02',
        rows: [
          { phone: '004740000001' },
          { fn: 'Same', zip: '0001' }
        ]
      },
      {
        segment: 'caravan',
        source: '03',
        rows: [{ phone: '40000001' }, { phone: '40000003' }]
      }
    ],
    [{ phone: '40000001' }]
  )
  assert.equal(result.uniqueIdentities, 3)
  assert.equal(result.excludedBuyers, 1)
  assert.equal(result.unmatchedBuyerStatus, 2)
  assert.equal(result.invalidRows, 1)
  assert.equal(
    result.segments.find(x => x.key === 'motorhome')
      ?.uniqueIdentities,
    2
  )
  assert.equal(
    result.overlap.find(
      x =>
        [x.left, x.right].includes('motorhome') &&
        [x.left, x.right].includes('caravan')
    )?.identities,
    1
  )
  assert.ok(!JSON.stringify(result).includes('4740000001'))
})

test('lookalike bearing customer label is never a buyer exclusion', () => {
  assert.deepEqual(
    getBuyerExclusions([
      {
        id: '1',
        subtype: 'LOOKALIKE',
        labels: ['high_value_customers'],
        buyerEvidence: true
      },
      {
        id: '2',
        subtype: 'CUSTOM',
        labels: [],
        buyerEvidence: true
      },
      {
        id: '3',
        subtype: 'CUSTOM',
        labels: ['general_customers'],
        buyerEvidence: false
      }
    ]),
    ['2']
  )
})

test('conflicting strong identities are quarantined instead of inheriting buyer status', () => {
  const result = auditAudienceSegments(
    [
      {
        segment: 'motorhome',
        source: '01',
        rows: [
          { phone: '40000001', email: 'a@example.com' },
          { phone: '40000001', email: 'b@example.com' }
        ]
      }
    ],
    [{ email: 'a@example.com' }]
  )
  assert.equal(result.uniqueIdentities, 0)
  assert.equal(result.excludedBuyers, 0)
  assert.equal(result.ambiguousRows, 1)
})

test('four criteria are AND, values are OR, first match never stacks', () => {
  const rules = buildTechDownValueRules([
    { key: '2683', name: 'Nordland', country_code: 'NO' },
    { key: '2692', name: 'Troms', country_code: 'NO' }
  ])
  assert.equal(rules.rules[0]?.criterias.length, 4)
  assert.equal(
    evaluateValueRules(rules, {
      AUDIENCE_LABEL: ['OTHER_1'],
      AGE: ['55-64'],
      LOCATION: ['2683'],
      PLACEMENT: ['FB_FEED']
    }),
    1.2
  )
  assert.equal(
    evaluateValueRules(rules, {
      AUDIENCE_LABEL: ['OTHER_1'],
      AGE: ['45-54'],
      LOCATION: ['2692'],
      PLACEMENT: ['FB_FEED']
    }),
    1.1
  )
  assert.equal(
    evaluateValueRules(rules, {
      AUDIENCE_LABEL: ['OTHER_2'],
      AGE: ['55-64'],
      LOCATION: ['2683'],
      PLACEMENT: ['FB_FEED']
    }),
    1
  )
  assert.throws(() =>
    buildTechDownValueRules([
      { key: '1', name: 'Unknown', country_code: 'NO' }
    ])
  )
})

test('detachment omits rule set ID entirely', () => {
  assert.deepEqual(buildValueRuleAttachment(null), {
    value_rules_applied: false
  })
  assert.deepEqual(buildValueRuleAttachment('123'), {
    value_rules_applied: true,
    value_rule_set_id: '123'
  })
})

test('batch checkpoints bind dataset and block uncertain interrupted uploads', () => {
  const keys = Array.from({ length: 20001 }, (_, i) => String(i))
  const batches = planAudienceBatches(keys, null)
  assert.deepEqual(
    batches.map(x => x.count),
    [9999, 9999, 3]
  )
  assert.equal(batches[2]?.lastBatch, true)
  assert.ok(batches[0])
  const checkpoint = {
    datasetHash: batches[0].datasetHash,
    acceptedThrough: 1,
    inFlight: null
  }
  assert.equal(
    planAudienceBatches(keys, checkpoint)[0]?.sequence,
    2
  )
  assert.throws(
    () =>
      planAudienceBatches(keys, { ...checkpoint, inFlight: 2 }),
    /uncertain/
  )
  assert.throws(
    () => planAudienceBatches([...keys, 'changed'], checkpoint),
    /dataset/
  )
})
