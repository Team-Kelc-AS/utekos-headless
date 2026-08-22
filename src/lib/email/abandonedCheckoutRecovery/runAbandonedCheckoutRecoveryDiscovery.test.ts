import assert from 'node:assert/strict'
import test from 'node:test'

import {
  type AbandonedCheckoutRecoveryDispatchPlan,
  type ShopifyAbandonedCheckoutRecoveryCandidate
} from './abandonedCheckoutRecovery'

import {
  runAbandonedCheckoutRecoveryDiscovery
} from './runAbandonedCheckoutRecoveryDiscovery'

const ACTIVATION_AT =
  new Date(
    '2026-08-08T00:00:00.000Z'
  )

const STARTED_AT =
  new Date(
    '2026-08-08T06:30:00.000Z'
  )

const COMPLETED_AT =
  new Date(
    '2026-08-08T06:30:01.000Z'
  )

const candidate:
  ShopifyAbandonedCheckoutRecoveryCandidate = {
    checkoutId:
      'gid://shopify/AbandonedCheckout/100',
    customerId:
      'gid://shopify/Customer/10',
    createdAt:
      '2026-08-08T05:00:00.000Z',
    updatedAt:
      '2026-08-08T05:15:00.000Z',
    completedAt:
      null,
    numberOfOrders:
      0,
    email:
      {
        address:
          'customer@example.com',
        marketingState:
          'SUBSCRIBED',
        validFormat:
          true
      }
  }

test(
  'discovery threads activation cutoff through candidate fetch and persists all three steps',
  async () => {
    const clock = [
      STARTED_AT,
      COMPLETED_AT
    ]

    let fetchActivationAt:
      Date | undefined

    let persistedPlans:
      readonly AbandonedCheckoutRecoveryDispatchPlan[] = []

    const summary =
      await runAbandonedCheckoutRecoveryDiscovery({
        activationAt:
          ACTIVATION_AT,

        now:
          () => {
            const date =
              clock.shift()

            assert.ok(date)

            return date
          },

        fetchCandidates:
          async input => {
            fetchActivationAt =
              input.activationAt

            return [candidate]
          },

        persistPlans:
          async plans => {
            persistedPlans =
              plans

            return {
              submitted:
                plans.length,
              affected:
                plans.length,
              unchanged:
                0
            }
          }
      })

    assert.equal(
      fetchActivationAt,
      ACTIVATION_AT
    )

    assert.deepEqual(
      persistedPlans.map(
        plan => plan.step
      ),
      [1, 2, 3]
    )

    assert.equal(
      summary.dispatchPlansBuilt,
      3
    )

    assert.equal(
      summary.pendingPlans,
      3
    )

    assert.deepEqual(
      summary.persistence,
      {
        submitted: 3,
        affected: 3,
        unchanged: 0
      }
    )
  }
)
