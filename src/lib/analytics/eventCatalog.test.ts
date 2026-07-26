import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalEventNames,
  eventCatalog,
  gaAutomaticEventDecisions,
  getEventCatalogEntry,
  providerIdentifierPolicy,
  technicalRetentionCaveat,
  type ProviderId
} from './eventCatalog'

const expectedCanonicalEventNames = [
  'page_view',
  'view_item_list',
  'select_item',
  'view_item',
  'add_to_wishlist',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
  'refund',
  'search',
  'view_search_results',
  'view_promotion',
  'select_promotion',
  'generate_lead',
  'form_start',
  'form_submit',
  'form_error',
  'filter_apply',
  'sort_apply',
  'variant_select',
  'size_guide_view',
  'checkout_error',
  'payment_error',
  'scroll_depth',
  'view_category',
  'hero_interact',
  'video_progress'
] as const

const providerIds = [
  'supabase',
  'google',
  'meta',
  'microsoft_uet',
  'posthog'
] as const satisfies readonly ProviderId[]

test('contains exactly the 31 v1 canonical events', () => {
  assert.equal(canonicalEventNames.length, 31)
  assert.deepEqual(
    [...canonicalEventNames],
    expectedCanonicalEventNames
  )
})

test('keeps every catalog key, entry name, and lookup aligned', () => {
  for (const name of canonicalEventNames) {
    const entry = getEventCatalogEntry(name)

    assert.equal(entry.name, name)
    assert.equal(eventCatalog[name], entry)
  }
})

test('defines the required owner, trigger, dedupe, consent, and provider contract for every event', () => {
  for (const name of canonicalEventNames) {
    const entry = eventCatalog[name]

    assert.equal(entry.version, 1)
    assert.ok(entry.owner.length > 0, `${name}: owner`)
    assert.ok(
      ['active', 'planned', 'blocked_source'].includes(
        entry.lifecycle
      ),
      `${name}: lifecycle`
    )

    assert.ok(
      entry.trigger.description.length > 0,
      `${name}: trigger`
    )
    assert.ok(
      entry.trigger.sources.length > 0,
      `${name}: sources`
    )
    assert.ok(
      entry.trigger.repeatability.length > 0,
      `${name}: repeatability`
    )
    assert.ok(
      entry.trigger.eventTime.length > 0,
      `${name}: event time`
    )
    assert.ok(
      entry.trigger.prerequisites.length > 0,
      `${name}: prerequisites`
    )

    assert.ok(
      entry.dedupe.eventId.length > 0,
      `${name}: event id`
    )
    assert.ok(entry.dedupe.reuse.length > 0, `${name}: reuse`)
    assert.ok(
      entry.dedupe.newEvent.length > 0,
      `${name}: new event`
    )
    assert.equal(
      entry.dedupe.ledgerIdempotencyKey,
      'event_name + event_id'
    )
    assert.equal(
      entry.dedupe.providerIdempotencyKey,
      'provider + event_name + event_id'
    )
    assert.equal(
      typeof entry.dedupe.browserServerShareEventId,
      'boolean'
    )
    assert.ok(
      entry.dedupe.retention.value > 0,
      `${name}: retention`
    )
    assert.equal(entry.dedupe.retention.scope, 'dedupe_key_only')

    assert.ok(entry.consent.browserCreation.length > 0)
    assert.ok(entry.consent.firstPartyCollection.length > 0)
    assert.ok(entry.consent.canonicalLedger.length > 0)
    assert.deepEqual(entry.consent.analyticsExport, [
      'analytics'
    ])
    assert.equal(
      entry.consent.piiPolicy,
      'consent_gated_provider_identifiers_only'
    )

    assert.deepEqual(
      Object.keys(entry.providers),
      providerIds,
      `${name}: provider allowlist`
    )

    for (const providerId of providerIds) {
      const provider = entry.providers[providerId]

      assert.ok(provider.support.length > 0)
      assert.ok('browser' in provider.transport)
      assert.ok('server' in provider.transport)
      assert.ok(Array.isArray(provider.requiredParameters))
      assert.ok(provider.consentRequirement.length > 0)
      assert.ok(provider.productionStatus.length > 0)
      assert.ok(provider.productionDetail.length > 0)
      assert.ok(
        ['active', 'disabled', 'blocked_no_worker'].includes(
          provider.serverOutbox
        )
      )

      if (provider.support !== 'not_relevant') {
        assert.ok(provider.eventName)
        assert.ok(
          provider.dedupeField === 'event_id' ||
            provider.dedupeField === 'transaction_id'
        )
        assert.equal(provider.adapterVersion, 1)
        assert.ok(provider.requiredParameters.length > 0)
      }
    }
  }
})

test('keeps blocked_source events isolated from active lifecycle', () => {
  const blockedSources = canonicalEventNames.filter(
    name => eventCatalog[name].lifecycle === 'blocked_source'
  )

  assert.deepEqual(blockedSources, [
    'add_shipping_info',
    'add_payment_info',
    'checkout_error',
    'payment_error'
  ])
})

test('marks all non-blocked catalog events as active', () => {
  const inactiveEvents = canonicalEventNames.filter(
    name => eventCatalog[name].lifecycle !== 'active'
  )

  assert.deepEqual(inactiveEvents, [
    'add_shipping_info',
    'add_payment_info',
    'checkout_error',
    'payment_error'
  ])
})

test('allows active Google, Meta, and Microsoft purchase server outboxes', () => {
  const activeOutboxes = canonicalEventNames.flatMap(eventName =>
    providerIds.flatMap(providerId =>
      (
        eventCatalog[eventName].providers[providerId]
          .serverOutbox === 'active'
      ) ?
        [`${providerId}:${eventName}`]
      : []
    )
  )

  assert.ok(activeOutboxes.includes('google:view_item'))
  assert.ok(activeOutboxes.includes('google:add_to_cart'))
  assert.ok(activeOutboxes.includes('meta:search'))
  assert.ok(activeOutboxes.includes('microsoft_uet:purchase'))
  assert.ok(activeOutboxes.includes('microsoft_uet:add_to_cart'))
  assert.ok(
    activeOutboxes.includes('microsoft_uet:begin_checkout')
  )
  assert.equal(
    eventCatalog.page_view.providers.meta.serverOutbox,
    'active'
  )
  assert.equal(
    eventCatalog.add_to_cart.providers.microsoft_uet
      .serverOutbox,
    'active'
  )
  assert.equal(
    eventCatalog.begin_checkout.providers.microsoft_uet
      .serverOutbox,
    'active'
  )
  assert.equal(
    eventCatalog.purchase.providers.microsoft_uet.serverOutbox,
    'active'
  )
})

test('declares Shopify Customer Events and Data Manager as the two purchase sources', () => {
  const googlePurchase = eventCatalog.purchase.providers.google

  assert.equal(
    googlePurchase.transport.browser,
    'shopify_customer_events'
  )
  assert.equal(
    googlePurchase.transport.server,
    'google_data_manager'
  )
  assert.ok(
    googlePurchase.requiredParameters.includes(
      'one_of(client_id,gclid,user_id)'
    )
  )
  assert.equal(googlePurchase.dedupeField, 'transaction_id')
})

test('records Shopify Admin order payment as the sole Purchase owner with reconciliation recovery', () => {
  const purchase = eventCatalog.purchase

  assert.equal(
    purchase.owner,
    'shopify_admin_notification_order_payment'
  )
  assert.deepEqual(purchase.trigger.sources, [
    'webhook',
    'server'
  ])
  assert.match(purchase.trigger.repeatability, /same event_id/)
  assert.match(purchase.trigger.repeatability, /duplicate/)
  assert.equal(purchase.dedupe.browserServerShareEventId, true)
})

test('records Shopify Admin refund creation as the sole Refund owner with reconciliation recovery', () => {
  const refund = eventCatalog.refund

  assert.equal(
    refund.owner,
    'shopify_admin_notification_refund_create'
  )
  assert.deepEqual(refund.trigger.sources, ['webhook', 'server'])
  assert.match(refund.trigger.repeatability, /same event_id/)
  assert.match(refund.trigger.repeatability, /duplicate/)
  assert.equal(refund.dedupe.browserServerShareEventId, true)
})

test('records current mixed Microsoft delivery and historical page_view backlog truth', () => {
  assert.equal(
    eventCatalog.view_item.providers.google.productionStatus,
    'active'
  )
  assert.match(
    eventCatalog.view_item.providers.google.productionDetail,
    /executed Data Manager/
  )
  assert.match(
    eventCatalog.view_item.providers.google.productionDetail,
    /not live-verified/
  )
  assert.equal(
    eventCatalog.view_item.providers.google.transport.browser,
    'google_tag_manager'
  )
  assert.equal(
    eventCatalog.view_item.providers.google.dedupeField,
    'transaction_id'
  )
  assert.ok(
    eventCatalog.view_item.providers.google.requiredParameters.includes(
      'transaction_id'
    )
  )
  assert.equal(
    eventCatalog.view_item.providers.microsoft_uet.transport
      .browser,
    'microsoft_uet'
  )
  assert.equal(
    eventCatalog.view_item.providers.microsoft_uet.serverOutbox,
    'blocked_no_worker'
  )
  assert.equal(
    eventCatalog.page_view.providers.meta.serverOutbox,
    'active'
  )
  assert.equal(
    eventCatalog.page_view.providers.microsoft_uet.serverOutbox,
    'blocked_no_worker'
  )
  assert.match(
    eventCatalog.page_view.providers.meta.productionDetail,
    /Historical blocked rows/
  )
  assert.match(
    eventCatalog.page_view.providers.microsoft_uet
      .productionDetail,
    /must not be replayed/
  )
})

test('classifies every GA automatic-event decision explicitly', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(gaAutomaticEventDecisions).map(
        ([feature, decision]) => [feature, decision.decision]
      )
    ),
    {
      automatic_page_view: 'disabled_canonical_owner',
      history_pageviews: 'disabled_canonical_owner',
      enhanced_measurement_scroll:
        'keep_until_canonical_active_then_disable',
      outbound_click: 'keep_ga_derived_non_canonical',
      site_search: 'keep_until_canonical_active_then_disable',
      form_interactions:
        'keep_until_canonical_active_then_disable',
      video_engagement:
        'keep_until_canonical_active_then_disable',
      file_downloads: 'keep_ga_derived_non_canonical',
      session_start: 'keep_ga_derived_system_event',
      first_visit: 'keep_ga_derived_system_event',
      user_engagement: 'keep_ga_derived_system_event'
    }
  )

  assert.deepEqual(
    gaAutomaticEventDecisions.site_search.canonicalReplacement,
    ['search', 'view_search_results']
  )
  assert.deepEqual(
    gaAutomaticEventDecisions.form_interactions
      .canonicalReplacement,
    ['form_start', 'form_submit']
  )

  const canonicalNameSet = new Set<string>(canonicalEventNames)

  assert.equal(canonicalNameSet.has('session_start'), false)
  assert.equal(canonicalNameSet.has('first_visit'), false)
  assert.equal(canonicalNameSet.has('user_engagement'), false)
})

test('states that retention is technical and limited to dedupe keys', () => {
  assert.match(technicalRetentionCaveat, /dedupe keys/)
  assert.match(
    technicalRetentionCaveat,
    /not a legal retention conclusion/
  )
})

test('keeps operational first-party persistence separate from provider export consent', () => {
  assert.equal(
    eventCatalog.purchase.providers.supabase.consentRequirement,
    'operational'
  )
  assert.equal(
    eventCatalog.refund.providers.supabase.consentRequirement,
    'operational'
  )
  assert.equal(
    eventCatalog.form_error.providers.supabase
      .consentRequirement,
    'analytics_or_operational'
  )
  assert.match(providerIdentifierPolicy, /Direct contact fields/)
  assert.match(providerIdentifierPolicy, /request-context IP/)
})
