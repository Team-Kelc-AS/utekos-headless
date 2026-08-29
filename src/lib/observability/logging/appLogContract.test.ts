import assert from 'node:assert/strict'
import test from 'node:test'
import { appLogInputSchema } from './appLogContract'

test('event-specific app log contracts reject customer identifiers', () => {
  const result = appLogInputSchema.safeParse({
    event: 'contact.submitted',
    level: 'INFO',
    data: {
      delivery: 'resend',
      email: 'customer@example.no'
    },
    context: {}
  })

  assert.equal(result.success, false)
})

test('event-specific app log contracts accept minimal operational fields', () => {
  const result = appLogInputSchema.parse({
    event: 'contact.atlas_skipped',
    level: 'INFO',
    data: { reasonCode: 'disabled' },
    context: {}
  })

  assert.deepEqual(result.data, { reasonCode: 'disabled' })
})

test('client error app logs accept only sanitized triage fields', () => {
  const parsed = appLogInputSchema.parse({
    event: 'client.error',
    level: 'ERROR',
    data: {
      source: 'window_error',
      message: 'ChunkLoadError',
      filename:
        'https://utekos.no/_next/static/chunks/app.js?token=secret',
      line: 12,
      column: 4
    },
    context: { route: '/skreddersy-varmen' }
  })

  assert.equal(
    parsed.event === 'client.error' ? parsed.data.filename : undefined,
    '/_next/static/chunks/app.js'
  )
  assert.equal(JSON.stringify(parsed).includes('token=secret'), false)
  assert.equal(
    appLogInputSchema.safeParse({
      ...parsed,
      data: {
        ...parsed.data,
        message: 'customer@example.no'
      }
    }).success,
    false
  )
})

test('Meta Dataset Quality warning accepts only PII-free snapshot fields', () => {
  const parsed = appLogInputSchema.parse({
    context: {},
    data: {
      datasetId: '1092362672918571',
      missingRequiredEvents: ['Lead'],
      snapshotDate: '2026-07-24'
    },
    event: 'meta_dataset_quality.incomplete',
    level: 'WARN'
  })

  assert.deepEqual(parsed.data, {
    datasetId: '1092362672918571',
    missingRequiredEvents: ['Lead'],
    snapshotDate: '2026-07-24'
  })

  assert.equal(
    appLogInputSchema.safeParse({
      ...parsed,
      data: {
        ...parsed.data,
        email: 'customer@example.no'
      }
    }).success,
    false
  )
})

test('commerce event logs accept only bounded operational fields', () => {
  const parsed = appLogInputSchema.parse({
    context: {
      pagePath:
        'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
      requestPath: '/api/events/begin-checkout',
      vercelId: 'arn1::request-1'
    },
    data: {
      checkoutMethod: 'klarna_express',
      currency: 'NOK',
      durationMs: 42,
      eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      eventName: 'begin_checkout',
      grossValue: 2499,
      itemCount: 1,
      quantity: 1,
      status: 'accepted'
    },
    event: 'commerce.event',
    level: 'INFO'
  })

  if (parsed.event !== 'commerce.event') {
    assert.fail('Expected commerce.event log')
  }

  assert.equal(
    parsed.context.pagePath,
    '/produkter/utekos-techdown'
  )
  assert.equal(
    appLogInputSchema.safeParse({
      ...parsed,
      data: {
        ...parsed.data,
        cartId: 'gid://shopify/Cart/secret'
      }
    }).success,
    false
  )
})

test('Klarna checkout logs reject tokens and customer data', () => {
  const valid = {
    context: {
      requestPath: '/api/klarna/orders'
    },
    data: {
      durationMs: 120,
      stage: 'order_request_received'
    },
    event: 'commerce.klarna_checkout',
    level: 'INFO'
  } as const

  assert.equal(appLogInputSchema.safeParse(valid).success, true)
  assert.equal(
    appLogInputSchema.safeParse({
      ...valid,
      data: {
        ...valid.data,
        authorizationToken: 'secret'
      }
    }).success,
    false
  )
})

test('purchase notification logs reject Shopify and customer identifiers', () => {
  const valid = {
    context: {
      requestPath: '/api/shopify/webhooks/orders-paid'
    },
    data: {
      delivery: 'sent',
      eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
    },
    event: 'commerce.purchase_notification_sent',
    level: 'INFO'
  } as const

  assert.equal(appLogInputSchema.safeParse(valid).success, true)
  assert.equal(
    appLogInputSchema.safeParse({
      ...valid,
      data: {
        ...valid.data,
        orderId: 'gid://shopify/Order/secret'
      }
    }).success,
    false
  )
  assert.equal(
    appLogInputSchema.safeParse({
      ...valid,
      data: {
        ...valid.data,
        email: 'customer@example.no'
      }
    }).success,
    false
  )
})
