import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createVippsShopifyAdminTokenProvider,
  createVippsShopifyOrders,
  toMinorUnits
} from './shopifyOrder'
import type { VippsConfig } from './config'
import { vippsPaymentSchema } from './payment'

const config: VippsConfig = {
  environment: 'test',
  apiBaseUrl: 'https://apitest.vipps.no',
  msn: '123456',
  clientId: 'fixture',
  clientSecret: 'fixture',
  subscriptionKey: 'fixture'
}
const env = {
  STORE_DOMAIN: 'live-fixture.myshopify.com',
  VIPPS_SHOPIFY_TEST_STORE_DOMAIN: 'test-fixture.myshopify.com',
  VIPPS_SHOPIFY_TEST_ADMIN_TOKEN: 'fixture'
}
const reference = 'utekos-express-fixture'
const id = 'gid://shopify/DraftOrder/123'
const order = {
  id: 'gid://shopify/Order/456',
  name: '#TEST',
  displayFinancialStatus: 'PAID'
}
const draft = {
  id,
  invoiceUrl: 'https://test-fixture.myshopify.com/123/invoices/fixture',
  tags: [reference],
  discountCodes: [],
  customAttributes: [{ key: 'vipps_reference', value: reference }],
  totalPriceSet: {
    presentmentMoney: { amount: '1790.00', currencyCode: 'NOK' }
  },
  order: null
}
const money = (value: number) => ({ currency: 'NOK', value })
const payment = (captured = 179000) =>
  vippsPaymentSchema.parse({
    reference,
    state: 'AUTHORIZED',
    amount: money(179000),
    aggregate: {
      authorizedAmount: money(179000),
      capturedAmount: money(captured),
      refundedAmount: money(0),
      cancelledAmount: money(0)
    },
    userDetails: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      mobileNumber: '4712345678'
    },
    shippingDetails: {
      address: {
        addressLine1: 'Testveien 1',
        city: 'Oslo',
        country: 'NO',
        postCode: '0001'
      },
      shippingCost: 0,
      shippingOptionId: 'utekos-standard-no',
      shippingOptionName: 'Standardfrakt'
    }
  })
type Operation = {
  query: string
  variables: Record<string, unknown>
}
function harness(responder: (operation: Operation) => unknown) {
  const calls: Operation[] = []
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(
      String(url),
      'https://test-fixture.myshopify.com/admin/api/2026-04/graphql.json'
    )
    const operation: Operation = JSON.parse(String(init?.body))
    calls.push(operation)
    return Response.json({ data: responder(operation) })
  }
  return {
    calls,
    adapter: createVippsShopifyOrders(config, env, fetcher)
  }
}

test('test payments cannot target the production Shopify store', () => {
  assert.throws(
    () =>
      createVippsShopifyOrders(config, {
        ...env,
        VIPPS_SHOPIFY_TEST_STORE_DOMAIN: env.STORE_DOMAIN
      }),
    /separate/
  )
  assert.throws(
    () =>
      createVippsShopifyOrders(config, {
        STORE_DOMAIN: env.STORE_DOMAIN,
        SHOPIFY_ADMIN_API_TOKEN: 'fixture'
      }),
    /not configured/
  )
})
test('test admin authentication is short-lived, coalesced and never used for production', async () => {
  let requests = 0
  let clock = 1_000_000
  const provider = createVippsShopifyAdminTokenProvider(
    config,
    env.VIPPS_SHOPIFY_TEST_STORE_DOMAIN,
    {
      ...env,
      VIPPS_SHOPIFY_TEST_ADMIN_TOKEN: undefined,
      SHOPIFY_EVENTHANDLER_APP_CLIENT_ID: 'client-id',
      SHOPIFY_EVENTHANDLER_APP_CLIENT_SECRET: 'client-secret'
    },
    async (url, init) => {
      requests += 1
      assert.equal(
        String(url),
        'https://test-fixture.myshopify.com/admin/oauth/access_token'
      )
      assert.equal(init?.method, 'POST')
      assert.equal(
        String(init?.body),
        'grant_type=client_credentials&client_id=client-id&client_secret=client-secret'
      )
      return Response.json({ access_token: `token-${requests}`, expires_in: 120 })
    },
    () => clock
  )
  assert.deepEqual(await Promise.all([provider(), provider()]), ['token-1', 'token-1'])
  assert.equal(requests, 1)
  clock += 61_000
  assert.equal(await provider(), 'token-2')
  assert.equal(requests, 2)
  assert.throws(
    () =>
      createVippsShopifyAdminTokenProvider(
        { ...config, environment: 'production' },
        env.STORE_DOMAIN,
        { ...env, SHOPIFY_ADMIN_API_TOKEN: undefined }
      ),
    /not configured/
  )
})
test('NOK amounts convert exactly and reject excess precision', () => {
  assert.equal(toMinorUnits('1790'), 179000)
  assert.equal(toMinorUnits('0.99'), 99)
  assert.equal(toMinorUnits('1.1'), 110)
  for (const invalid of [
    '1.001',
    '-1',
    'NaN',
    '1e3',
    '9007199254740991'
  ])
    assert.throws(() => toMinorUnits(invalid))
})
test('test catalog availability uses Admin money scalars and the shop currency', async () => {
  const h = harness(({ query }) => {
    assert.match(query, /VippsProductByHandle/)
    return {
      shop: { currencyCode: 'NOK' },
      product: {
        handle: 'fixture-product',
        variants: {
          nodes: [
            {
              id: 'gid://shopify/ProductVariant/999',
              price: '20.00',
              inventoryQuantity: 0,
              inventoryPolicy: 'CONTINUE'
            }
          ]
        }
      }
    }
  })
  await assert.doesNotReject(
    h.adapter.findAvailableVariant(
      'fixture-product',
      'gid://shopify/ProductVariant/999'
    )
  )
})
test('draft order operations request the checkout URL and applied discount codes', async () => {
  const h = harness(({ query }) => {
    assert.match(query, /invoiceUrl/)
    assert.match(query, /discountCodes/)
    return { draftOrder: draft }
  })
  assert.deepEqual(await h.adapter.read(id), draft)
})
test('reservation, partial capture and refunded capture cannot mark Shopify paid', async () => {
  const h = harness(() => {
    throw new Error('must not call Shopify')
  })
  for (const captured of [0, 100])
    await assert.rejects(
      h.adapter.completePaid(
        id,
        reference,
        179000,
        payment(captured)
      ),
      /capture_not_verified/
    )
  const refunded = payment()
  refunded.aggregate!.refundedAmount.value = 100
  await assert.rejects(
    h.adapter.completePaid(id, reference, 179000, refunded),
    /capture_not_verified/
  )
  assert.equal(h.calls.length, 0)
})
test('prepare uses the verified Vipps customer and delivery address', async () => {
  const h = harness(({ query }) =>
    query.includes('VippsDraftUpdate') ?
      { draftOrderUpdate: { draftOrder: draft, userErrors: [] } }
    : { draftOrder: draft }
  )
  await h.adapter.prepare(id, reference, 179000, payment())
  assert.deepEqual(h.calls[1]!.variables, {
    id,
    input: {
      email: 'test@example.com',
      phone: '4712345678',
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address1: 'Testveien 1',
        address2: '',
        city: 'Oslo',
        zip: '0001',
        countryCode: 'NO',
        phone: '4712345678'
      }
    }
  })
})
test('changed Shopify total cannot pass preparation', async () => {
  const changed = {
    ...draft,
    totalPriceSet: {
      presentmentMoney: {
        amount: '1791.00',
        currencyCode: 'NOK'
      }
    }
  }
  const h = harness(({ query }) =>
    query.includes('VippsDraftUpdate') ?
      {
        draftOrderUpdate: { draftOrder: changed, userErrors: [] }
      }
    : { draftOrder: draft }
  )
  await assert.rejects(
    h.adapter.prepare(id, reference, 179000, payment()),
    /amount_mismatch/
  )
})
test('capture success completes the saved draft and requires Shopify PAID readback', async () => {
  let completed = false
  const h = harness(({ query, variables }) => {
    assert.equal(variables.id, id)
    if (query.includes('VippsComplete')) {
      completed = true
      return {
        draftOrderComplete: {
          draftOrder: { id, order },
          userErrors: []
        }
      }
    }
    return {
      draftOrder: { ...draft, order: completed ? order : null }
    }
  })
  assert.deepEqual(
    await h.adapter.completePaid(
      id,
      reference,
      179000,
      payment()
    ),
    { id: order.id, name: order.name }
  )
  assert.equal(h.calls.length, 3)
})
test('ambiguous complete timeout retries by reading same draft, without duplicate order', async () => {
  let completed = false
  const h = harness(({ query }) => {
    if (query.includes('VippsComplete')) {
      completed = true
      throw new Error('timeout after completion')
    }
    return {
      draftOrder: { ...draft, order: completed ? order : null }
    }
  })
  await assert.rejects(
    h.adapter.completePaid(id, reference, 179000, payment()),
    /timeout/
  )
  assert.deepEqual(
    await h.adapter.completePaid(
      id,
      reference,
      179000,
      payment()
    ),
    { id: order.id, name: order.name }
  )
  assert.equal(
    h.calls.filter(call => call.query.includes('VippsComplete'))
      .length,
    1
  )
  assert.ok(h.calls.every(call => call.variables.id === id))
})
test('Shopify completion HTTP success without paid order does not report paid', async () => {
  const h = harness(({ query }) =>
    query.includes('VippsComplete') ?
      {
        draftOrderComplete: {
          draftOrder: null,
          userErrors: [{ message: 'not completed' }]
        }
      }
    : { draftOrder: draft }
  )
  await assert.rejects(
    h.adapter.completePaid(id, reference, 179000, payment()),
    /PAID readback/
  )
})
test('a different draft reference fails before any mutation', async () => {
  const h = harness(() => ({
    draftOrder: {
      ...draft,
      customAttributes: [
        { key: 'vipps_reference', value: 'another-reference' }
      ]
    }
  }))
  await assert.rejects(
    h.adapter.completePaid(id, reference, 179000, payment()),
    /identity_or_amount_mismatch/
  )
  assert.equal(h.calls.length, 1)
})
