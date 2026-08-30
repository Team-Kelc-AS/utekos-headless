import assert from 'node:assert/strict'
import test from 'node:test'
import { applyCanonicalCollectionContext } from './applyCanonicalCollectionContext'

const deniedConsent = {
  analytics: 'denied' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

const experiment = {
  key: 'skreddersy-varmen-layout-v1' as const,
  variant: 'legacy' as const
}

test('adds the experiment only to analytics-consented collection', () => {
  const event = {
    consent: deniedConsent,
    event_name: 'add_to_cart',
    experiment
  }

  const granted = applyCanonicalCollectionContext(event, {
    consent: { ...deniedConsent, analytics: 'granted' },
    experiment,
    hasResponse: true
  })
  const denied = applyCanonicalCollectionContext(event, {
    consent: deniedConsent,
    experiment,
    hasResponse: true
  })

  assert.deepEqual(granted.experiment, experiment)
  assert.equal(denied.experiment, undefined)
})
