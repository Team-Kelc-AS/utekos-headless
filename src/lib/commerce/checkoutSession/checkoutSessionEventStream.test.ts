import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkoutSessionSchema,
  type CheckoutSession,
  type CheckoutSessionShopifyCart
} from './checkoutSessionSchema'

import {
  createCheckoutSession
} from './createCheckoutSession'

import {
  createCheckoutSessionEvent
} from './checkoutSessionEvent'

import {
  CHECKOUT_SESSION_EVENT_STREAM_MAX_LENGTH,
  CheckoutSessionEventStreamError,
  createCheckoutSessionEventStream,
  type CheckoutSessionEventStreamRedisClient
} from  './checkoutSessionEventStream'

import {
  CHECKOUT_SESSION_EVENT_STREAM_KEY
} from './checkoutSessionKeys'

const NOW =
  '2026-08-16T16:00:00.000Z'

const SESSION_ID =
  '11111111-1111-4111-8111-111111111111'

const ATTEMPT_ID =
  '22222222-2222-4222-8222-222222222222'

const EVENT_ID =
  '33333333-3333-4333-8333-333333333333'

const JOURNAL_EVENT_ID =
  '44444444-4444-4444-8444-444444444444'

const CART_TOKEN =
  'hWNFitvj3hogaYwyfNbKRUId'

class FakeStreamRedisClient
  implements CheckoutSessionEventStreamRedisClient
{
  readonly commands:
    string[][] = []

  nextResult: unknown =
    '1786896000000-0'

  async sendCommand(
    command: string[]
  ): Promise<unknown> {
    this.commands.push(
      command
    )

    return this.nextResult
  }
}

function createCart(): CheckoutSessionShopifyCart {
  return {
    cart_gid:
      `gid://shopify/Cart/${CART_TOKEN}`,

    cart_token:
      CART_TOKEN,

    source:
      'storefront_api',

    line_items: [
      {
        line_id: null,

        line_key: null,

        product_id:
          'gid://shopify/Product/9240112693496',

        variant_id:
          'gid://shopify/ProductVariant/46944403915000',

        sku:
          'TECHDOWN-HAVDYP-L',

        title:
          'Utekos TechDown™',

        variant_title:
          'Havdyp / Stor / Unisex',

        vendor:
          'Utekos',

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
    environment:
      'production',

    shopifyCart:
      createCart(),

    now: () =>
      new Date(NOW),

    sessionIdFactory:
      () => SESSION_ID
  })
}

function createSessionWithAttempt(): CheckoutSession {
  const session =
    createSession()

  return checkoutSessionSchema.parse({
    ...session,

    revision: 1,

    checkout_attempts: [
      {
        attempt_id:
          ATTEMPT_ID,

        begin_checkout_event_id:
          EVENT_ID,

        method:
          'shopify_checkout',

        started_at:
          NOW,

        last_updated_at:
          NOW,

        milestones: {
          began_at:
            NOW,

          shipping_info_submitted_at:
            null,

          payment_info_submitted_at:
            null,

          completed_at:
            null
        },

        shopify: {
          status:
            'unresolved',

          checkout_token:
            null,

          private_checkout_url:
            null,

          checkout_url_fingerprint:
            null,

          abandoned_checkout_id:
            null,

          private_abandoned_checkout_url:
            null,

          abandoned_checkout_created_at:
            null,

          abandoned_checkout_updated_at:
            null,

          most_recent_step:
            null,

          inventory_available:
            null,

          native_email_state:
            null,

          customer_has_no_order_since_abandonment:
            null,

          customer_has_no_draft_order_since_abandonment:
            null
        },

        klarna:
          null
      }
    ],

    active_attempt_id:
      ATTEMPT_ID
  })
}

function readStreamField(
  command: string[],
  field: string
): string | undefined {
  const index =
    command.indexOf(field)

  if (
    index < 0
  ) {
    return undefined
  }

  return command[
    index + 1
  ]
}

test(
  'creates a session-level journal event from Registry state',
  () => {
    const session =
      createSession()

    const event =
      createCheckoutSessionEvent({
        session,

        eventType:
          'checkout_session.created',

        source:
          'registry',

        metadata: {
          checkout_method:
            'not_selected',

          total_quantity:
            2
        },

        now: () =>
          new Date(NOW),

        eventIdFactory:
          () =>
            JOURNAL_EVENT_ID
      })

    assert.equal(
      event.schema,
      'utekos.checkout_session_event.v1'
    )

    assert.equal(
      event.event_id,
      JOURNAL_EVENT_ID
    )

    assert.equal(
      event.session_id,
      SESSION_ID
    )

    assert.equal(
      event.cart_token,
      CART_TOKEN
    )

    assert.equal(
      event.session_revision,
      0
    )

    assert.equal(
      event.attempt_id,
      null
    )
  }
)

test(
  'creates an attempt-level journal event only for an attempt owned by the session',
  () => {
    const session =
      createSessionWithAttempt()

    const event =
      createCheckoutSessionEvent({
        session,

        eventType:
          'checkout_attempt.started',

        source:
          'begin_checkout_collector',

        attemptId:
          ATTEMPT_ID,

        metadata: {
          checkout_method:
            'shopify_checkout'
        },

        now: () =>
          new Date(NOW),

        eventIdFactory:
          () =>
            JOURNAL_EVENT_ID
      })

    assert.equal(
      event.attempt_id,
      ATTEMPT_ID
    )

    assert.equal(
      event.session_revision,
      1
    )
  }
)

test(
  'rejects an attempt ID that does not belong to the session',
  () => {
    const session =
      createSession()

    assert.throws(
      () =>
        createCheckoutSessionEvent({
          session,

          eventType:
            'checkout_attempt.started',

          source:
            'registry',

          attemptId:
            ATTEMPT_ID
        }),
      /must reference an attempt in the session/
    )
  }
)

test(
  'rejects private checkout URLs from journal metadata',
  () => {
    const session =
      createSession()

    assert.throws(
      () =>
        createCheckoutSessionEvent({
          session,

          eventType:
            'shopify_checkout.url_resolved',

          source:
            'shopify_checkout_route',

          metadata: {
            private_checkout_url:
              'https://kasse.utekos.no/secret'
          }
        }),
      /cannot contain private field/
    )
  }
)

test(
  'rejects capability URLs even when hidden under an innocent metadata key',
  () => {
    const session =
      createSession()

    assert.throws(
      () =>
        createCheckoutSessionEvent({
          session,

          eventType:
            'shopify_checkout.url_resolved',

          source:
            'shopify_checkout_route',

          metadata: {
            note:
              'https://kasse.utekos.no/checkouts/ac/example/recover?key=secret'
          }
        }),
      /cannot contain a capability URL/
    )
  }
)

test(
  'rejects customer PII from journal metadata',
  () => {
    const session =
      createSession()

    assert.throws(
      () =>
        createCheckoutSessionEvent({
          session,

          eventType:
            'checkout_recovery.evaluated',

          source:
            'recovery_worker',

          metadata: {
            email:
              'kunde@example.no'
          }
        }),
      /cannot contain private field/
    )
  }
)

test(
  'appends a validated event to the bounded Redis Stream',
  async () => {
    const client =
      new FakeStreamRedisClient()

    const stream =
      createCheckoutSessionEventStream({
        getClient:
          async () => client
      })

    const event =
      createCheckoutSessionEvent({
        session:
          createSessionWithAttempt(),

        eventType:
          'checkout_attempt.started',

        source:
          'begin_checkout_collector',

        attemptId:
          ATTEMPT_ID,

        metadata: {
          checkout_method:
            'shopify_checkout',

          item_count:
            1,

          quantity:
            2
        },

        now: () =>
          new Date(NOW),

        eventIdFactory:
          () =>
            JOURNAL_EVENT_ID
      })

    const result =
      await stream.append(event)

    assert.equal(
      result.stream_id,
      '1786896000000-0'
    )

    assert.equal(
      result.event.event_id,
      JOURNAL_EVENT_ID
    )

    assert.equal(
      client.commands.length,
      1
    )

    const command =
      client.commands[0]

    assert.ok(command)

    assert.deepEqual(
      command.slice(0, 6),
      [
        'XADD',
        CHECKOUT_SESSION_EVENT_STREAM_KEY,
        'MAXLEN',
        '~',
        String(
          CHECKOUT_SESSION_EVENT_STREAM_MAX_LENGTH
        ),
        '*'
      ]
    )

    assert.equal(
      readStreamField(
        command,
        'event_id'
      ),
      JOURNAL_EVENT_ID
    )

    assert.equal(
      readStreamField(
        command,
        'event_type'
      ),
      'checkout_attempt.started'
    )

    assert.equal(
      readStreamField(
        command,
        'session_id'
      ),
      SESSION_ID
    )

    assert.equal(
      readStreamField(
        command,
        'session_revision'
      ),
      '1'
    )

    assert.equal(
      readStreamField(
        command,
        'cart_token'
      ),
      CART_TOKEN
    )

    assert.equal(
      readStreamField(
        command,
        'attempt_id'
      ),
      ATTEMPT_ID
    )

    assert.deepEqual(
      JSON.parse(
        readStreamField(
          command,
          'metadata'
        ) ?? '{}'
      ),
      {
        checkout_method:
          'shopify_checkout',

        item_count:
          1,

        quantity:
          2
      }
    )
  }
)

test(
  'rejects an invalid Redis Stream ID',
  async () => {
    const client =
      new FakeStreamRedisClient()

    client.nextResult =
      'unexpected'

    const stream =
      createCheckoutSessionEventStream({
        getClient:
          async () => client
      })

    const event =
      createCheckoutSessionEvent({
        session:
          createSession(),

        eventType:
          'checkout_session.created',

        source:
          'registry',

        now: () =>
          new Date(NOW),

        eventIdFactory:
          () =>
            JOURNAL_EVENT_ID
      })

    await assert.rejects(
      () =>
        stream.append(event),
      CheckoutSessionEventStreamError
    )
  }
)