import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalEventNames,
  eventCatalog,
  type ProviderId
} from './eventCatalog'
import { canonicalSignalNames } from './canonicalSignalContract'

const providerIds = [
  'supabase',
  'google',
  'meta',
  'microsoft_uet',
  'pinterest',
  'snapchat'
] as const satisfies readonly ProviderId[]

test('defines an explicit signal contract for every catalog event', () => {
  for (const eventName of canonicalEventNames) {
    const entry = eventCatalog[eventName]

    assert.deepEqual(
      Object.keys(entry.signals),
      canonicalSignalNames,
      `${eventName}: signal allowlist`
    )

    for (const signal of canonicalSignalNames) {
      const rule = entry.signals[signal]

      assert.ok(
        rule.requirement.length > 0,
        `${eventName}:${signal}: requirement`
      )
      if (rule.requirement === 'not_applicable') {
        assert.deepEqual(
          rule.allowedSources,
          [],
          `${eventName}:${signal}: not-applicable sources`
        )
      } else {
        assert.ok(
          rule.allowedSources.length > 0,
          `${eventName}:${signal}: sources`
        )
      }
      assert.ok(
        Array.isArray(rule.allowedUnavailableReasons),
        `${eventName}:${signal}: unavailable reasons`
      )
    }
  }
})

test('defines provider signal delivery for every provider entry', () => {
  for (const eventName of canonicalEventNames) {
    for (const providerId of providerIds) {
      const provider =
        eventCatalog[eventName].providers[providerId]

      assert.deepEqual(
        Object.keys(provider.signalDelivery),
        canonicalSignalNames,
        `${providerId}:${eventName}: signal delivery allowlist`
      )
    }
  }
})

test('requires complete Meta website matching projection', () => {
  for (const eventName of canonicalEventNames) {
    const meta = eventCatalog[eventName].providers.meta

    if (
      meta.transport.server !== 'meta_conversions_api' ||
      meta.support !== 'supported'
    ) {
      continue
    }

    assert.equal(
      meta.signalDelivery.event_source_url,
      'required',
      `meta:${eventName}: event_source_url`
    )
    assert.equal(
      meta.signalDelivery.client_ip_address,
      'send_when_available',
      `meta:${eventName}: client_ip_address`
    )
    assert.equal(
      meta.signalDelivery.client_user_agent,
      'send_when_available',
      `meta:${eventName}: client_user_agent`
    )
    assert.equal(
      meta.signalDelivery.external_id,
      'send_when_available',
      `meta:${eventName}: external_id`
    )
    assert.equal(
      meta.signalDelivery.meta_fbclid,
      'derive_to_provider_format',
      `meta:${eventName}: fbclid`
    )
    assert.equal(
      meta.signalDelivery.meta_fbc,
      'send_when_available',
      `meta:${eventName}: fbc`
    )
    assert.equal(
      meta.signalDelivery.meta_fbp,
      'send_when_available',
      `meta:${eventName}: fbp`
    )
  }
})

test('requires Pinterest CAPI request and click signals', () => {
  for (const eventName of canonicalEventNames) {
    const pinterest = eventCatalog[eventName].providers.pinterest

    if (
      pinterest.transport.server !==
        'pinterest_conversions_api' ||
      pinterest.support !== 'supported'
    ) {
      continue
    }

    assert.equal(
      pinterest.signalDelivery.event_source_url,
      'required'
    )
    assert.equal(
      pinterest.signalDelivery.client_ip_address,
      'send_when_available'
    )
    assert.equal(
      pinterest.signalDelivery.client_user_agent,
      'send_when_available'
    )
    assert.equal(
      pinterest.signalDelivery.external_id,
      'send_when_available'
    )
    assert.equal(
      pinterest.signalDelivery.click_ids,
      'send_when_available'
    )
    assert.equal(
      pinterest.signalDelivery.meta_fbclid,
      'not_applicable'
    )
    assert.equal(
      pinterest.signalDelivery.meta_fbc,
      'not_applicable'
    )
    assert.equal(
      pinterest.signalDelivery.meta_fbp,
      'not_applicable'
    )
  }
})

test('requires Snapchat CAPI v3 request and click signals', () => {
  for (const eventName of canonicalEventNames) {
    const snapchat = eventCatalog[eventName].providers.snapchat

    if (
      snapchat.transport.server !== 'snap_conversions_api_v3' ||
      snapchat.support !== 'supported'
    ) {
      continue
    }

    assert.equal(
      snapchat.signalDelivery.event_source_url,
      'required'
    )
    assert.equal(
      snapchat.signalDelivery.client_ip_address,
      'send_when_available'
    )
    assert.equal(
      snapchat.signalDelivery.client_user_agent,
      'send_when_available'
    )
    assert.equal(
      snapchat.signalDelivery.external_id,
      'send_when_available'
    )
    assert.equal(
      snapchat.signalDelivery.click_ids,
      'send_when_available'
    )
  }
})

test('requires Microsoft CAPI request and click signals', () => {
  for (const eventName of canonicalEventNames) {
    const microsoft =
      eventCatalog[eventName].providers.microsoft_uet

    if (
      microsoft.transport.server !== 'microsoft_uet_capi' ||
      microsoft.support !== 'supported'
    ) {
      continue
    }

    assert.equal(
      microsoft.signalDelivery.event_source_url,
      'required'
    )
    assert.equal(
      microsoft.signalDelivery.client_ip_address,
      'send_when_available'
    )
    assert.equal(
      microsoft.signalDelivery.client_user_agent,
      'send_when_available'
    )
    assert.equal(
      microsoft.signalDelivery.external_id,
      'send_when_available'
    )
    assert.equal(
      microsoft.signalDelivery.click_ids,
      'send_when_available'
    )
  }
})

test('keeps Google IP sharing policy-aware for EEA traffic', () => {
  for (const eventName of canonicalEventNames) {
    const google = eventCatalog[eventName].providers.google

    if (
      google.support === 'not_relevant' ||
      (google.transport.browser === null &&
        google.transport.server === null)
    ) {
      continue
    }

    assert.equal(
      google.signalDelivery.client_ip_address,
      'send_when_supported_and_permitted'
    )
    assert.equal(
      google.signalDelivery.click_ids,
      'send_when_supported_and_permitted'
    )
  }
})

test('requires purchase and refund to inherit attribution signals', () => {
  for (const eventName of ['purchase', 'refund'] as const) {
    const signals = eventCatalog[eventName].signals

    for (const signal of canonicalSignalNames) {
      assert.equal(
        signals[signal].requirement,
        'required_from_attribution_snapshot',
        `${eventName}:${signal}`
      )
    }
  }
})

test('persists every canonical signal through first-party storage', () => {
  for (const eventName of canonicalEventNames) {
    const supabase = eventCatalog[eventName].providers.supabase

    if (supabase.support === 'not_relevant') continue

    for (const signal of canonicalSignalNames) {
      assert.equal(
        supabase.signalDelivery[signal],
        'persist_canonical',
        `supabase:${eventName}:${signal}`
      )
    }
  }
})
