import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildTechDownExperimentSpec } from './buildTechDownExperimentSpec'
import { getTechDownContribution } from './getTechDownContribution'
import { getLabelMigrationBlockers } from './getLabelMigrationBlockers'

test('experiment is paused, costs unknown, 50/50, fixed cap, no auto extension', () => {
  const plan = buildTechDownExperimentSpec()
  assert.equal(plan.status, 'PAUSED')
  assert.equal(plan.totalMaximumNok, 42000)
  assert.deepEqual(
    plan.cells.map(cell => cell.allocationPercent),
    [50, 50]
  )
  assert.equal(plan.randomization.method, 'META_SPLIT_TEST')
  assert.equal(plan.randomization.providerVerified, false)
  assert.equal(plan.startTime, null)
  assert.equal(plan.autoExtend, false)
  assert.equal(plan.confidenceLevel, 0.95)
  assert.equal(plan.costs, null)
})

test('break-even CAC never invents absent costs or future LTV', () => {
  assert.throws(() =>
    getTechDownContribution({ netRevenueExVat: 2000 })
  )
  assert.deepEqual(
    getTechDownContribution({
      netRevenueExVat: 2000,
      goodsCost: 500,
      shippingFulfillmentCost: 150,
      paymentCost: 50,
      expectedReturnsCost: 100
    }),
    {
      contributionBeforeAdsNok: 1200,
      breakEvenNewCustomerCacNok: 1200
    }
  )
})

test('label collision includes lookalikes and global live rules, not only suggestions', () => {
  const blockers = getLabelMigrationBlockers({
    targetLabel: 'OTHER_1',
    targetAudienceIds: ['1'],
    audiences: [
      { id: '1', subtype: 'CUSTOM', labels: ['engaged_users'] },
      { id: '2', subtype: 'LOOKALIKE', labels: ['other_1'] }
    ],
    ruleSets: [
      {
        id: '9',
        labels: ['engaged_users'],
        attachedAdsets: [{ id: '10', effectiveStatus: 'ACTIVE' }]
      }
    ],
    sourceReceiptVerified: false
  })
  assert.deepEqual(blockers.map(b => b.code).sort(), [
    'label_occupied',
    'live_rule_dependency',
    'source_receipt_missing'
  ])
})
