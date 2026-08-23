import assert from 'node:assert/strict'
import test from 'node:test'
import {
  capturePreConsentClickIdsFromUrl,
  clearPreConsentClickIds,
  PRE_CONSENT_CLICK_ID_GLOBAL_KEY,
  readPreConsentClickIds,
  readPreConsentClickIdSnapshot,
  setPreConsentClickIdDecision
} from './preConsentClickIdStore'

test('reads only the four supported pre-consent marketing click IDs', () => {
  const scope: Record<string, unknown> = {
    [PRE_CONSENT_CLICK_ID_GLOBAL_KEY]: {
      clickIds: {
        fbclid: 'Meta-AbC',
        msclkid: 'Microsoft-123',
        epik: 'Pinterest-XyZ',
        sc_click_id: ' Snap-._+/= ',
        gclid: 'not-in-phase-one'
      },
      observedAtMs: {
        fbclid: 1_787_500_000_000,
        msclkid: 1_787_500_000_001,
        epik: 1_787_500_000_002,
        sc_click_id: 1_787_500_000_003,
        gclid: 1_787_500_000_004
      },
      decision: 'pending'
    }
  }

  assert.deepEqual(readPreConsentClickIdSnapshot(scope), {
    clickIds: {
      fbclid: 'Meta-AbC',
      msclkid: 'Microsoft-123',
      epik: 'Pinterest-XyZ',
      sc_click_id: ' Snap-._+/= '
    },
    observedAtMs: {
      fbclid: 1_787_500_000_000,
      msclkid: 1_787_500_000_001,
      epik: 1_787_500_000_002,
      sc_click_id: 1_787_500_000_003
    },
    decision: 'pending'
  })
})

test('captures the four phase-one click IDs from the landing URL', () => {
  const scope: Record<string, unknown> = {}
  const observedAt = 1_787_500_000_123

  capturePreConsentClickIdsFromUrl(
    'https://utekos.no/?fbclid=Meta-A&msclkid=Ms-B&epik=Pin-C&ScCid=%20Snap-D%2B%2F%3D%20&gclid=not-phase-one',
    scope,
    observedAt
  )

  assert.deepEqual(readPreConsentClickIdSnapshot(scope), {
    clickIds: {
      fbclid: 'Meta-A',
      msclkid: 'Ms-B',
      epik: 'Pin-C',
      sc_click_id: ' Snap-D+/= '
    },
    observedAtMs: {
      fbclid: observedAt,
      msclkid: observedAt,
      epik: observedAt,
      sc_click_id: observedAt
    },
    decision: 'pending'
  })
})

test('preserves opaque click ID casing and characters', () => {
  const scope: Record<string, unknown> = {
    [PRE_CONSENT_CLICK_ID_GLOBAL_KEY]: {
      clickIds: {
        fbclid: 'AbC-DeF_123',
        sc_click_id: ' A+B/C== '
      },
      observedAtMs: {},
      decision: 'pending'
    }
  }

  assert.deepEqual(readPreConsentClickIds(scope), {
    fbclid: 'AbC-DeF_123',
    sc_click_id: ' A+B/C== '
  })
})

test('decline clears the volatile snapshot and blocks recapture', () => {
  const scope: Record<string, unknown> = {}

  capturePreConsentClickIdsFromUrl(
    'https://utekos.no/?fbclid=meta-before-decline',
    scope,
    1
  )
  clearPreConsentClickIds(scope)
  capturePreConsentClickIdsFromUrl(
    'https://utekos.no/?fbclid=meta-after-decline',
    scope,
    2
  )

  assert.deepEqual(readPreConsentClickIdSnapshot(scope), {
    clickIds: {},
    observedAtMs: {},
    decision: 'denied'
  })
})

test('a later explicit grant re-enables volatile capture', () => {
  const scope: Record<string, unknown> = {}

  clearPreConsentClickIds(scope)
  setPreConsentClickIdDecision('granted', scope)
  capturePreConsentClickIdsFromUrl(
    'https://utekos.no/?msclkid=microsoft-after-grant',
    scope,
    3
  )

  assert.deepEqual(readPreConsentClickIdSnapshot(scope), {
    clickIds: { msclkid: 'microsoft-after-grant' },
    observedAtMs: { msclkid: 3 },
    decision: 'granted'
  })
})
