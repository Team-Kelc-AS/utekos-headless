import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearPreConsentClickIds,
  PRE_CONSENT_CLICK_ID_GLOBAL_KEY,
  readPreConsentClickIds,
  readPreConsentClickIdSnapshot
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
      }
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
    }
  })
})

test('preserves opaque click ID casing and characters', () => {
  const scope: Record<string, unknown> = {
    [PRE_CONSENT_CLICK_ID_GLOBAL_KEY]: {
      clickIds: {
        fbclid: 'AbC-DeF_123',
        sc_click_id: ' A+B/C== '
      },
      observedAtMs: {}
    }
  }

  assert.deepEqual(readPreConsentClickIds(scope), {
    fbclid: 'AbC-DeF_123',
    sc_click_id: ' A+B/C== '
  })
})

test('clears the volatile snapshot without creating durable storage', () => {
  const scope: Record<string, unknown> = {
    [PRE_CONSENT_CLICK_ID_GLOBAL_KEY]: {
      clickIds: { fbclid: 'meta-1', msclkid: 'microsoft-1' },
      observedAtMs: { fbclid: 1, msclkid: 2 }
    }
  }

  clearPreConsentClickIds(scope)

  assert.equal(readPreConsentClickIdSnapshot(scope), undefined)
  assert.deepEqual(scope[PRE_CONSENT_CLICK_ID_GLOBAL_KEY], {
    clickIds: {},
    observedAtMs: {}
  })
})
