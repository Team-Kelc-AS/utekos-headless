import assert from 'node:assert/strict'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { eventCatalog } from '../../src/lib/analytics/eventCatalog'
import { GOOGLE_COMMERCE_EVENT_MAP } from '../../src/lib/analytics/googleCommerceEventMapping'
import { META_COMMERCE_EVENT_MAP } from '../../src/lib/analytics/metaCommerceEventMapping'
import { microsoftCommerceRules } from '../../src/lib/analytics/microsoftCommerceRules'
import { PINTEREST_CANONICAL_EVENT_MAP } from '../../src/lib/analytics/pinterestEventMapping'
import { SNAPCHAT_CANONICAL_EVENT_MAP } from '../../src/lib/analytics/snapchatEventMapping'
import { canonicalAddToCartSchema } from '../../src/lib/analytics/addToCartEvent'
import { canonicalPurchaseSchema } from '../../src/lib/analytics/purchaseEvent'
import { mapCanonicalAddToCartToMeta } from '../../src/lib/analytics/server/mapCanonicalAddToCartToMeta'
import { mapCanonicalAddToCartToMicrosoftUet } from '../../src/lib/analytics/server/mapCanonicalAddToCartToMicrosoftUet'
import { mapCanonicalPurchaseToMicrosoftUet } from '../../src/lib/analytics/server/mapCanonicalPurchaseToMicrosoftUet'
import { planCanonicalEventDispatch } from '../../src/lib/analytics/server/planCanonicalEventDispatch'
import { buildCanonicalContext } from '../../src/lib/canonical-control/buildCanonicalContext'
import { getCanonicalContext } from '../../src/lib/canonical-control/getCanonicalContext'
import { buildCanonicalEventManifest } from './generateCanonicalEventManifest'
import { readCanonicalPilotRules } from './readCanonicalPilotRules'
import { utekosEventsContractCatalog } from './utekosEventsContractCatalog'

const cart = canonicalAddToCartSchema.parse({
  ...canonicalAddToCartSchema.parse(
    utekosEventsContractCatalog.find(
      event => event.eventName === 'add_to_cart'
    )!.example
  ),
  click_id: { msclkid: 'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab' }
})
const purchaseInput = {
  ...cart,
  event_name: 'purchase',
  source: 'webhook',
  custom_data: {
    currency: 'NOK',
    value: 100,
    transaction_id: 'order_123',
    order_name: '#123',
    items: [
      {
        item_id: 'variant_1',
        item_name: 'Fixture',
        quantity: 1,
        unit_price: 100,
        final_unit_price: 0
      }
    ]
  }
}
Reflect.deleteProperty(purchaseInput, 'page_title')
const purchase = canonicalPurchaseSchema.parse(purchaseInput)

test('both pilot events bind runtime rules and provider paths to strict agent results', () => {
  const cartResult = mapCanonicalAddToCartToMicrosoftUet(cart)
  assert.equal(
    cartResult.customData.transactionId,
    cart.custom_data.cart_mutation_id
  )
  assert.equal(
    cartResult.customData.eventLabel,
    cart.custom_data.cart_mutation_id
  )
  assert.equal(
    cartResult.customData.items?.[0]?.price,
    cart.custom_data.items[0]!.unit_price
  )
  const purchaseResult =
    mapCanonicalPurchaseToMicrosoftUet(purchase)
  assert.equal(
    purchaseResult.customData.transactionId,
    'order_123'
  )
  assert.equal(purchaseResult.customData.items?.[0]?.price, 0)
  const fallback = structuredClone(purchase)
  delete fallback.custom_data.items[0]!.final_unit_price
  assert.equal(
    mapCanonicalPurchaseToMicrosoftUet(fallback).customData
      .items?.[0]?.price,
    100
  )
  for (const name of ['add_to_cart', 'purchase'] as const) {
    const result = getCanonicalContext({ name })
    const contract =
      result.contexts[0]!.definition.runtime_contract
    assert.equal(
      contract.coverage,
      'pilot_event_runtime_and_provider_connections'
    )
    assert.deepEqual(
      contract.rules.find(
        rule => rule.kind === 'microsoft_commerce'
      ),
      microsoftCommerceRules[name]
    )
    const mappingRules = contract.rules.filter(
      rule => rule.kind === 'provider_event_mapping'
    )
    assert.equal(mappingRules.length, 5)
    const dispatchRules = contract.rules.filter(
      rule => rule.kind === 'provider_dispatch'
    )
    assert.equal(dispatchRules.length, 6)
    assert.equal(contract.connections.length, 51)
    assert(
      contract.connections.every(
        connection => connection.evidence === 'source_verified'
      )
    )
    assert(
      contract.connections.some(
        connection =>
          connection.from.symbol === 'POST' &&
          connection.to.symbol ===
            (name === 'add_to_cart' ?
              'handleCanonicalAddToCartRequest'
            : 'handleShopifyOrdersPaidWebhook')
      )
    )
    assert(
      contract.connections.some(
        connection =>
          connection.from.symbol === 'providerAdapterRegistry' &&
          connection.to.symbol.includes(
            name === 'add_to_cart' ? 'AddToCart' : 'Purchase'
          )
      )
    )
    const lineage =
      result.contexts[0]!.definition.parameter_lineage.filter(
        line => line.authority === 'runtime_rule'
      )
    assert.equal(lineage.length, 3)
    assert(
      lineage.every(
        line =>
          line.runtime_rule_id ===
          microsoftCommerceRules[name].id
      )
    )
    assert.equal(
      lineage.find(
        line =>
          line.target_parameter ===
          'data[].customData.transactionId'
      )?.source,
      `custom_data.${microsoftCommerceRules[name].transaction_id_source}`
    )
    assert.equal(
      contract.remaining_metadata,
      'catalog_declarations_not_runtime_verified'
    )
  }
  assert.equal(
    getCanonicalContext({ name: 'view_item' }).contexts[0]!
      .definition.runtime_contract.coverage,
    'not_migrated'
  )
})

test('provider mapping rules use the same definitions as the real mappers and catalog', () => {
  const definitions = {
    google: GOOGLE_COMMERCE_EVENT_MAP,
    meta: META_COMMERCE_EVENT_MAP,
    microsoft_uet: {
      add_to_cart: {
        browser:
          microsoftCommerceRules.add_to_cart.browser_event_name,
        server:
          microsoftCommerceRules.add_to_cart.server_event_name
      },
      purchase: {
        browser:
          microsoftCommerceRules.purchase.browser_event_name,
        server: microsoftCommerceRules.purchase.server_event_name
      }
    },
    pinterest: {
      add_to_cart: {
        browser: PINTEREST_CANONICAL_EVENT_MAP.add_to_cart.tag,
        server: PINTEREST_CANONICAL_EVENT_MAP.add_to_cart.api
      },
      purchase: {
        browser: PINTEREST_CANONICAL_EVENT_MAP.purchase.tag,
        server: PINTEREST_CANONICAL_EVENT_MAP.purchase.api
      }
    },
    snapchat: {
      add_to_cart: {
        browser: SNAPCHAT_CANONICAL_EVENT_MAP.add_to_cart,
        server: SNAPCHAT_CANONICAL_EVENT_MAP.add_to_cart
      },
      purchase: {
        browser: SNAPCHAT_CANONICAL_EVENT_MAP.purchase,
        server: SNAPCHAT_CANONICAL_EVENT_MAP.purchase
      }
    }
  } as const

  for (const name of ['add_to_cart', 'purchase'] as const) {
    const contract = getCanonicalContext({ name }).contexts[0]!
      .definition.runtime_contract
    for (const provider of [
      'google',
      'meta',
      'microsoft_uet',
      'pinterest',
      'snapchat'
    ] as const) {
      const rule = contract.rules.find(
        candidate =>
          candidate.kind === 'provider_event_mapping' &&
          candidate.provider === provider
      )
      assert(rule?.kind === 'provider_event_mapping')
      assert.equal(
        rule.browser_event_name,
        definitions[provider][name].browser
      )
      assert.equal(
        rule.server_event_name,
        definitions[provider][name].server
      )
      assert.equal(
        eventCatalog[name].providers[provider].eventName,
        rule.server_event_name
      )
    }
  }

  assert.equal(
    mapCanonicalAddToCartToMeta(cart).normalize().event_name,
    META_COMMERCE_EVENT_MAP.add_to_cart.server
  )
})

test('changing one in-memory rule changes runtime and generated agent contract together', () => {
  const rule = microsoftCommerceRules.purchase
  const original = rule.item_price_sources
  try {
    Object.assign(rule, { item_price_sources: ['unit_price'] })
    assert.equal(
      mapCanonicalPurchaseToMicrosoftUet(purchase).customData
        .items?.[0]?.price,
      100
    )
    const regenerated = buildCanonicalEventManifest()
    const result = buildCanonicalContext(
      { name: 'purchase' },
      regenerated,
      null
    )
    const commerceRule =
      result.contexts[0]!.definition.runtime_contract.rules.find(
        candidate => candidate.kind === 'microsoft_commerce'
      )
    assert(commerceRule?.kind === 'microsoft_commerce')
    assert.deepEqual(commerceRule.item_price_sources, [
      'unit_price'
    ])
    assert.notEqual(
      result.manifest_sha256,
      getCanonicalContext({ name: 'purchase' }).manifest_sha256
    )
    assert.equal(
      result.contexts[0]!.definition.parameter_lineage.find(
        line =>
          line.target_parameter ===
            'data[].customData.items[].price' &&
          line.authority === 'runtime_rule'
      )?.source,
      'custom_data.items[].unit_price'
    )
  } finally {
    Object.assign(rule, { item_price_sources: original })
  }
  assert.equal(
    mapCanonicalPurchaseToMicrosoftUet(purchase).customData
      .items?.[0]?.price,
    0
  )
})

test('changing catalog dispatch ownership changes planner and generated contract together', () => {
  const metaPolicy = eventCatalog.add_to_cart.providers.meta
  const original = metaPolicy.serverOutbox
  try {
    Object.assign(metaPolicy, { serverOutbox: 'disabled' })
    assert.equal(
      planCanonicalEventDispatch(cart).some(
        dispatch => dispatch.provider === 'meta'
      ),
      false
    )
    const regenerated = buildCanonicalEventManifest()
    const rule = regenerated.events
      .find(event => event.name === 'add_to_cart')!
      .runtime_contract.rules.find(
        candidate =>
          candidate.kind === 'provider_dispatch' &&
          candidate.provider === 'meta'
      )
    assert(rule?.kind === 'provider_dispatch')
    assert.equal(rule.server_outbox, 'disabled')
  } finally {
    Object.assign(metaPolicy, { serverOutbox: original })
  }
  assert.equal(
    planCanonicalEventDispatch(cart).some(
      dispatch => dispatch.provider === 'meta'
    ),
    true
  )
})

test('generation rejects a provider mapper disconnected from the shared executable rule', () => {
  const root = resolve(import.meta.dirname, '../..')
  const inspected = readCanonicalPilotRules(root)
  const fixture = mkdtempSync(join(tmpdir(), 'canonical-pilot-'))
  try {
    for (const source of inspected.sourceFiles) {
      const target = join(fixture, source)
      mkdirSync(dirname(target), { recursive: true })
      const original = readFileSync(join(root, source), 'utf8')
      writeFileSync(
        target,
        (
          source.endsWith(
            'mapCanonicalPurchaseToMicrosoftUet.ts'
          )
        ) ?
          original.replace(
            'resolveMicrosoftCommerceRule(event)',
            'unrelatedMapper(event)'
          )
        : original
      )
    }
    assert.throws(
      () => readCanonicalPilotRules(fixture),
      /PILOT_RUNTIME_BINDING_MISMATCH/
    )
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})
