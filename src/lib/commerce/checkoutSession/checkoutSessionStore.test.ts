import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkoutSessionByCartTokenKey,
  checkoutSessionIdIndexKey
} from './checkoutSessionKeys'

import {
  createCheckoutSession
} from './createCheckoutSession'

import {
  CheckoutSessionCorruptionError,
  CheckoutSessionStoreError,
  createCheckoutSessionStore,
  type CheckoutSessionRedisClient
} from './checkoutSessionStore'

import type {
  CheckoutSession,
  CheckoutSessionShopifyCart
} from './checkoutSessionSchema'

const NOW =
  '2026-08-16T16:00:00.000Z'

const SESSION_ID =
  '11111111-1111-4111-8111-111111111111'

const CART_TOKEN =
  'hWNFitvj3hogaYwyfNbKRUId'

const CART_GID =
  `gid://shopify/Cart/${CART_TOKEN}`

type EvalCall = {
  script: string
  options: {
    keys: string[]
    arguments: string[]
  }
}

class FakeRedisClient
  implements CheckoutSessionRedisClient
{
  readonly values =
    new Map<string, string>()

  readonly evalCalls: EvalCall[] = []

  readonly evalResults: unknown[] = []

  async get(
    key: string
  ): Promise<string | null> {
    return (
      this.values.get(key) ??
      null
    )
  }

  async eval(
    script: string,
    options: {
      keys: string[]
      arguments: string[]
    }
  ): Promise<unknown> {
    this.evalCalls.push({
      script,
      options
    })

    if (
      this.evalResults.length === 0
    ) {
      throw new Error(
        'Fake Redis has no scripted EVAL result'
      )
    }

    return this.evalResults.shift()
  }
}

function createCart(): CheckoutSessionShopifyCart {
  return {
    cart_gid: CART_GID,

    cart_token: CART_TOKEN,

    source: 'storefront_api',

    line_items: [
      {
        line_id: null,

        line_key: null,

        product_id:
          'gid://shopify/Product/9240112693496',

        variant_id:
          'gid://shopify/ProductVariant/46944403915000',

        sku: 'TECHDOWN-HAVDYP-L',

        title: 'Utekos TechDown™',

        variant_title:
          'Havdyp / Stor / Unisex',

        vendor: 'Utekos',

        quantity: 2,

        unit_price: {
          amount: '1790',
          currency_code: 'NOK'
        },

        line_total: {
          amount: '3580',
          currency_code: 'NOK'
        },

        selected_options: [
          {
            name: 'Farge',
            value: 'Havdyp'
          },
          {
            name: 'Størrelse',
            value: 'Stor'
          },
          {
            name: 'Kjønn',
            value: 'Unisex'
          }
        ],

        image_url: null,

        available_for_sale: true,

        taxable: true
      }
    ],

    total_quantity: 2,

    subtotal: {
      amount: '3580',
      currency_code: 'NOK'
    },

    total: {
      amount: '3580',
      currency_code: 'NOK'
    },

    provider_updated_at: null,

    first_observed_at: NOW,

    last_observed_at: NOW
  }
}

function createSession(): CheckoutSession {
  return createCheckoutSession({
    environment: 'production',

    shopifyCart: createCart(),

    now: () => new Date(NOW),

    sessionIdFactory: () =>
      SESSION_ID
  })
}

function createStore(
  client: FakeRedisClient
) {
  return createCheckoutSessionStore({
    getClient: async () => client,

    now: () => new Date(NOW)
  })
}

test(
  'creates a deterministic initial Checkout Session',
  () => {
    const session =
      createSession()

    assert.equal(
      session.schema,
      'utekos.checkout_session.v1'
    )

    assert.equal(
      session.session_id,
      SESSION_ID
    )

    assert.equal(
      session.revision,
      0
    )

    assert.equal(
      session.state,
      'active'
    )

    assert.equal(
      session.shopify_cart.cart_token,
      CART_TOKEN
    )

    assert.deepEqual(
      session.checkout_attempts,
      []
    )

    assert.equal(
      session.active_attempt_id,
      null
    )

    assert.equal(
      session.first_seen_at,
      NOW
    )

    assert.equal(
      session.last_seen_at,
      NOW
    )

    assert.equal(
      session.expires_at,
      '2026-08-30T16:00:00.000Z'
    )
  }
)

test(
  'rejects an invalid session factory TTL',
  () => {
    assert.throws(
      () =>
        createCheckoutSession({
          environment:
            'production',

          shopifyCart:
            createCart(),

          ttlSeconds: 0
        }),
      /TTL must be a positive integer/
    )
  }
)

test(
  'creates a Registry session and secondary index through one atomic Redis script',
  async () => {
    const client =
      new FakeRedisClient()

    client.evalResults.push(
      JSON.stringify({
        status: 'created'
      })
    )

    const store =
      createStore(client)

    const session =
      createSession()

    const result =
      await store.create(
        session
      )

    assert.equal(
      result.status,
      'created'
    )

    assert.equal(
      client.evalCalls.length,
      1
    )

    const call =
      client.evalCalls[0]

    assert.ok(call)

    assert.deepEqual(
      call.options.keys,
      [
        checkoutSessionByCartTokenKey(
          CART_TOKEN
        ),

        checkoutSessionIdIndexKey(
          SESSION_ID
        )
      ]
    )

    assert.equal(
      call.options.arguments[1],
      String(60 * 60 * 24 * 14)
    )

    assert.equal(
      call.options.arguments[2],
      CART_TOKEN
    )

    /**
     * Formatting-independent assertion.
     *
     * Accepts both:
     *
     * redis.call('SET', ...)
     *
     * and:
     *
     * redis.call(
     *   'SET',
     *   ...
     * )
     */
    assert.match(
      call.script,
      /redis\.call\(\s*'SET'/
    )

    assert.match(
      call.script,
      /index_conflict/
    )
  }
)

test(
  'returns the existing Registry session when atomic create finds the cart',
  async () => {
    const client =
      new FakeRedisClient()

    const session =
      createSession()

    client.evalResults.push(
      JSON.stringify({
        status: 'exists',
        current:
          JSON.stringify(session)
      })
    )

    const result =
      await createStore(
        client
      ).create(session)

    assert.equal(
      result.status,
      'exists'
    )

    if (
      result.status !== 'exists'
    ) {
      assert.fail(
        'Expected exists result'
      )
    }

    assert.equal(
      result.current.session_id,
      SESSION_ID
    )

    assert.equal(
      result.current.revision,
      0
    )
  }
)

test(
  'rejects create for a session whose revision is not zero',
  async () => {
    const client =
      new FakeRedisClient()

    const session =
      createSession()

    const invalidCandidate = {
      ...session,
      revision: 1
    }

    await assert.rejects(
      () =>
        createStore(
          client
        ).create(
          invalidCandidate
        ),
      CheckoutSessionStoreError
    )

    assert.equal(
      client.evalCalls.length,
      0
    )
  }
)

test(
  'performs compare-and-set using the expected revision',
  async () => {
    const client =
      new FakeRedisClient()

    client.evalResults.push(
      JSON.stringify({
        status: 'updated'
      })
    )

    const session =
      createSession()

    const nextSession: CheckoutSession =
      {
        ...session,

        revision: 1,

        last_seen_at:
          '2026-08-16T16:01:00.000Z'
      }

    const result =
      await createStore(
        client
      ).compareAndSet({
        cartToken: CART_TOKEN,

        expectedRevision: 0,

        nextSession
      })

    assert.equal(
      result.status,
      'updated'
    )

    if (
      result.status !== 'updated'
    ) {
      assert.fail(
        'Expected updated result'
      )
    }

    assert.equal(
      result.session.revision,
      1
    )

    const call =
      client.evalCalls[0]

    assert.ok(call)

    assert.equal(
      call.options.arguments[0],
      '0'
    )

    assert.equal(
      call.options.arguments[3],
      CART_TOKEN
    )

    assert.match(
      call.script,
      /current\.revision/
    )

    assert.match(
      call.script,
      /identity_mismatch/
    )
  }
)

test(
  'returns the current session when compare-and-set detects a concurrent revision',
  async () => {
    const client =
      new FakeRedisClient()

    const current =
      createSession()

    const concurrentCurrent: CheckoutSession =
      {
        ...current,
        revision: 1,
        last_seen_at:
          '2026-08-16T16:00:30.000Z'
      }

    client.evalResults.push(
      JSON.stringify({
        status: 'conflict',
        current:
          JSON.stringify(
            concurrentCurrent
          )
      })
    )

    const attemptedNext: CheckoutSession =
      {
        ...current,
        revision: 1,
        last_seen_at:
          '2026-08-16T16:01:00.000Z'
      }

    const result =
      await createStore(
        client
      ).compareAndSet({
        cartToken: CART_TOKEN,

        expectedRevision: 0,

        nextSession:
          attemptedNext
      })

    assert.equal(
      result.status,
      'conflict'
    )

    if (
      result.status !== 'conflict'
    ) {
      assert.fail(
        'Expected conflict result'
      )
    }

    assert.equal(
      result.current.revision,
      1
    )

    assert.equal(
      result.current.last_seen_at,
      '2026-08-16T16:00:30.000Z'
    )
  }
)

test(
  'does not call Redis when next revision violates CAS semantics',
  async () => {
    const client =
      new FakeRedisClient()

    const session =
      createSession()

    await assert.rejects(
      () =>
        createStore(
          client
        ).compareAndSet({
          cartToken:
            CART_TOKEN,

          expectedRevision: 0,

          nextSession: {
            ...session,
            revision: 2
          }
        }),
      /expectedRevision \+ 1/
    )

    assert.equal(
      client.evalCalls.length,
      0
    )
  }
)

test(
  'reads a session through the session ID secondary index',
  async () => {
    const client =
      new FakeRedisClient()

    const session =
      createSession()

    client.values.set(
      checkoutSessionIdIndexKey(
        SESSION_ID
      ),
      CART_TOKEN
    )

    client.values.set(
      checkoutSessionByCartTokenKey(
        CART_TOKEN
      ),
      JSON.stringify(session)
    )

    const result =
      await createStore(
        client
      ).getBySessionId(
        SESSION_ID
      )

    assert.ok(result)

    assert.equal(
      result.session_id,
      SESSION_ID
    )

    assert.equal(
      result.shopify_cart.cart_token,
      CART_TOKEN
    )
  }
)

test(
  'throws instead of silently ignoring corrupt Registry JSON',
  async () => {
    const client =
      new FakeRedisClient()

    client.values.set(
      checkoutSessionByCartTokenKey(
        CART_TOKEN
      ),
      '{not-valid-json'
    )

    await assert.rejects(
      () =>
        createStore(
          client
        ).getByCartToken(
          CART_TOKEN
        ),
      CheckoutSessionCorruptionError
    )
  }
)