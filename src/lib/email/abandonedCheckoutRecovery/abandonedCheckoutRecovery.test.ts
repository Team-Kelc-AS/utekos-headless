import {
    deepStrictEqual,
    equal,
    ok,
    rejects
  } from 'node:assert/strict'
  import { test } from 'node:test'
  
  import {
    ABANDONED_CHECKOUT_RECOVERY_SEQUENCE_VERSION,
    buildAbandonedCheckoutRecoveryPlan,
    getAbandonedCheckoutRecoveryResendIdempotencyKey,
    toAbandonedCheckoutRecoveryDispatchInsert,
    type ShopifyAbandonedCheckoutRecoveryCandidate
  } from './abandonedCheckoutRecovery'
  import {
    fetchShopifyAbandonedCheckoutRecoveryCandidates,
    type ShopifyAdminGraphqlExecutor
  } from './fetchShopifyAbandonedCheckoutRecoveryCandidates'
  
  const NOW =
    new Date(
      '2026-08-08T06:30:00.000Z'
    )

  function assertDefined<T>(
    value: T | undefined
  ): asserts value is T {
    ok(value !== undefined)
  }
  
  function checkout(
    overrides: Partial<
      ShopifyAbandonedCheckoutRecoveryCandidate
    > = {}
  ): ShopifyAbandonedCheckoutRecoveryCandidate {
    return {
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
      email: {
        address:
          'kunde@example.no',
        marketingState:
          'SUBSCRIBED',
        validFormat:
          true
      },
      ...overrides
    }
  }
  
  test(
    'eligible checkout creates the +1, +7 and +24 hour sequence',
    () => {
      const plan =
        buildAbandonedCheckoutRecoveryPlan(
          [checkout()],
          NOW
        )
  
      equal(
        plan.length,
        3
      )
  
      deepStrictEqual(
        plan[0],
        {
          shopifyAbandonedCheckoutId:
            'gid://shopify/AbandonedCheckout/100',
          shopifyCustomerId:
            'gid://shopify/Customer/10',
          sequenceVersion:
            2,
          step:
            1,
          checkoutCreatedAt:
            '2026-08-08T05:00:00.000Z',
          checkoutUpdatedAt:
            '2026-08-08T05:15:00.000Z',
          dueAt:
            '2026-08-08T06:00:00.000Z',
          nextAttemptAt:
            '2026-08-08T06:00:00.000Z',
          status:
            'pending',
          suppressionReason:
            null,
          suppressedAt:
            null
        }
      )

      deepStrictEqual(
        plan.map(row => ({ step: row.step, dueAt: row.dueAt })),
        [
          { step: 1, dueAt: '2026-08-08T06:00:00.000Z' },
          { step: 2, dueAt: '2026-08-08T12:00:00.000Z' },
          { step: 3, dueAt: '2026-08-09T05:00:00.000Z' }
        ]
      )
    }
  )

  test(
    'checkout created before activation is suppressed without backfill',
    () => {
      const rows = buildAbandonedCheckoutRecoveryPlan(
        [checkout()],
        NOW,
        new Date('2026-08-08T05:00:00.001Z')
      )

      equal(rows.length, 3)
      equal(rows.every(row => row.status === 'suppressed'), true)
      equal(
        rows.every(row => row.suppressionReason === 'before_activation'),
        true
      )
    }
  )
  
  test(
    'all non-subscribed marketing states are suppressed',
    () => {
      for (
        const marketingState of [
          'UNSUBSCRIBED',
          'NOT_SUBSCRIBED',
          'PENDING',
          'INVALID'
        ] as const
      ) {
        const [row] =
          buildAbandonedCheckoutRecoveryPlan(
            [
              checkout({
                email: {
                  address:
                    'kunde@example.no',
                  marketingState,
                  validFormat:
                    marketingState !==
                    'INVALID'
                }
              })
            ],
            NOW
          )

        assertDefined(row)
  
        equal(
          row.status,
          'suppressed'
        )
  
        equal(
          row.suppressionReason,
          marketingState === 'INVALID' ?
            'invalid_email'
          : 'not_subscribed'
        )
      }
    }
  )
  
  test(
    'completed checkout is suppressed as recovered',
    () => {
      const [row] =
        buildAbandonedCheckoutRecoveryPlan(
          [
            checkout({
              completedAt:
                '2026-08-08T05:30:00.000Z'
            })
          ],
          NOW
        )

      assertDefined(row)
  
      equal(
        row.status,
        'suppressed'
      )
  
      equal(
        row.suppressionReason,
        'recovered'
      )
    }
  )
  
  test(
    'customer with any existing order is suppressed',
    () => {
      const [row] =
        buildAbandonedCheckoutRecoveryPlan(
          [
            checkout({
              numberOfOrders:
                1
            })
          ],
          NOW
        )

      assertDefined(row)
  
      equal(
        row.suppressionReason,
        'customer_has_orders'
      )
    }
  )
  
  test(
    'unknown order count fails closed',
    () => {
      const [row] =
        buildAbandonedCheckoutRecoveryPlan(
          [
            checkout({
              numberOfOrders:
                null
            })
          ],
          NOW
        )

      assertDefined(row)
  
      equal(
        row.suppressionReason,
        'unknown_order_count'
      )
    }
  )
  
  test(
    'only newest checkout per customer remains eligible',
    () => {
      const older =
        checkout({
          checkoutId:
            'gid://shopify/AbandonedCheckout/100',
          createdAt:
            '2026-08-07T20:00:00.000Z',
          updatedAt:
            '2026-08-07T20:10:00.000Z'
        })
  
      const newer =
        checkout({
          checkoutId:
            'gid://shopify/AbandonedCheckout/101',
          createdAt:
            '2026-08-08T04:00:00.000Z',
          updatedAt:
            '2026-08-08T04:10:00.000Z'
        })
  
      const plan =
        buildAbandonedCheckoutRecoveryPlan(
          [older, newer],
          NOW
        )
  
      const byId =
        Object.fromEntries(
          plan.map(row => [
            row.shopifyAbandonedCheckoutId,
            row
          ])
        )

      const olderPlan =
        byId[
          'gid://shopify/AbandonedCheckout/100'
        ]

      const newerPlan =
        byId[
          'gid://shopify/AbandonedCheckout/101'
        ]

      assertDefined(olderPlan)
      assertDefined(newerPlan)

      equal(
        olderPlan.suppressionReason,
        'superseded_by_newer_checkout'
      )
  
      equal(
        newerPlan.status,
        'pending'
      )
    }
  )
  
  test(
    'missing email is suppressed',
    () => {
      const [row] =
        buildAbandonedCheckoutRecoveryPlan(
          [
            checkout({
              email:
                null
            })
          ],
          NOW
        )

      assertDefined(row)
  
      equal(
        row.suppressionReason,
        'missing_email'
      )
    }
  )
  
  test(
    'invalid email is suppressed',
    () => {
      const [row] =
        buildAbandonedCheckoutRecoveryPlan(
          [
            checkout({
              email: {
                address:
                  'not-valid',
                marketingState:
                  'SUBSCRIBED',
                validFormat:
                  false
              }
            })
          ],
          NOW
        )

      assertDefined(row)
  
      equal(
        row.suppressionReason,
        'invalid_email'
      )
    }
  )
  
  test(
    'checkout outside seven-day window is suppressed',
    () => {
      const [row] =
        buildAbandonedCheckoutRecoveryPlan(
          [
            checkout({
              createdAt:
                '2026-07-31T06:29:59.999Z'
            })
          ],
          NOW
        )

      assertDefined(row)
  
      equal(
        row.suppressionReason,
        'outside_window'
      )
    }
  )
  
  test(
    'future checkout timestamp fails closed',
    () => {
      const [row] =
        buildAbandonedCheckoutRecoveryPlan(
          [
            checkout({
              createdAt:
                '2026-08-08T06:30:00.001Z'
            })
          ],
          NOW
        )

      assertDefined(row)
  
      equal(
        row.suppressionReason,
        'future_checkout_timestamp'
      )
    }
  )
  
  test(
    'database insert contains no raw email address',
    () => {
      const [plan] =
        buildAbandonedCheckoutRecoveryPlan(
          [checkout()],
          NOW
        )

      assertDefined(plan)
  
      const insert =
        toAbandonedCheckoutRecoveryDispatchInsert(
          plan
        )
  
      equal(
        JSON.stringify(insert).includes(
          'kunde@example.no'
        ),
        false
      )
  
      equal(
        Object.hasOwn(
          insert,
          'email'
        ),
        false
      )
    }
  )
  
  test(
    'Resend idempotency key is deterministic per checkout, sequence and step',
    () => {
      const input = {
        shopifyAbandonedCheckoutId:
          'gid://shopify/AbandonedCheckout/100',
        sequenceVersion:
          ABANDONED_CHECKOUT_RECOVERY_SEQUENCE_VERSION,
        step:
          1
      }
  
      const first =
        getAbandonedCheckoutRecoveryResendIdempotencyKey(
          input
        )
  
      const second =
        getAbandonedCheckoutRecoveryResendIdempotencyKey(
          input
        )
  
      equal(
        first,
        'abandoned-checkout:gid://shopify/AbandonedCheckout/100:v2:step-1'
      )
  
      equal(
        first,
        second
      )
    }
  )
  
  test(
    'Shopify discovery paginates and normalizes checkout candidates',
    async () => {
      const calls: Array<{
        query: string
        variables: Record<string, unknown>
      }> = []
  
      const responses: unknown[] = [
        {
          data: {
            abandonedCheckouts: {
              nodes: [
                {
                  id:
                    'gid://shopify/AbandonedCheckout/100',
                  createdAt:
                    '2026-08-08T05:00:00.000Z',
                  updatedAt:
                    '2026-08-08T05:15:00.000Z',
                  completedAt:
                    null,
                  customer: {
                    id:
                      'gid://shopify/Customer/10',
                    numberOfOrders:
                      '0',
                    defaultEmailAddress: {
                      emailAddress:
                        'kunde@example.no',
                      marketingState:
                        'SUBSCRIBED',
                      validFormat:
                        true
                    }
                  }
                }
              ],
              pageInfo: {
                hasNextPage:
                  true,
                endCursor:
                  'cursor-1'
              }
            }
          }
        },
        {
          abandonedCheckouts: {
            nodes: [
              {
                id:
                  'gid://shopify/AbandonedCheckout/101',
                createdAt:
                  '2026-08-08T05:30:00.000Z',
                updatedAt:
                  '2026-08-08T05:45:00.000Z',
                completedAt:
                  null,
                customer:
                  null
              }
            ],
            pageInfo: {
              hasNextPage:
                false,
              endCursor:
                null
            }
          }
        }
      ]
  
      const executeAdminGraphql:
        ShopifyAdminGraphqlExecutor =
        async request => {
          calls.push(request)
  
          const response =
            responses.shift()
  
          if (!response) {
            throw new Error(
              'Unexpected extra Shopify request'
            )
          }
  
          return response
        }
  
      const candidates =
        await fetchShopifyAbandonedCheckoutRecoveryCandidates(
          {
            executeAdminGraphql,
            now:
              NOW
          }
        )
  
      equal(
        calls.length,
        2
      )

      const firstCall = calls[0]
      const secondCall = calls[1]

      assertDefined(firstCall)
      assertDefined(secondCall)
  
      equal(
        firstCall.variables.query,
        'created_at:>=\'2026-08-01T06:30:00.000Z\' recovery_state:not_recovered'
      )
  
      equal(
        firstCall.variables.after,
        null
      )
  
      equal(
        secondCall.variables.after,
        'cursor-1'
      )
  
      equal(
        candidates.length,
        2
      )
  
      deepStrictEqual(
        candidates[0],
        checkout()
      )
  
      deepStrictEqual(
        candidates[1],
        {
          checkoutId:
            'gid://shopify/AbandonedCheckout/101',
          customerId:
            null,
          createdAt:
            '2026-08-08T05:30:00.000Z',
          updatedAt:
            '2026-08-08T05:45:00.000Z',
          completedAt:
            null,
          numberOfOrders:
            null,
          email:
            null
        }
      )
    }
  )
  
  test(
    'Shopify GraphQL errors fail closed',
    async () => {
      const executeAdminGraphql:
        ShopifyAdminGraphqlExecutor =
        async () => ({
          data:
            null,
          errors: [
            {
              message:
                'Access denied'
            }
          ]
        })
  
      await rejects(
        () =>
          fetchShopifyAbandonedCheckoutRecoveryCandidates(
            {
              executeAdminGraphql,
              now:
                NOW
            }
          ),
        /Shopify Admin GraphQL failed: Access denied/
      )
    }
  )
