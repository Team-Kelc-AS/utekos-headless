import assert from 'node:assert/strict'
import test from 'node:test'
import { getMagazineHeroTransitionName } from './getMagazineHeroTransitionName'

test('returns the stable hero transition name for an enabled article', () => {
  assert.equal(
    getMagazineHeroTransitionName('hva-er-utekos'),
    'utekos-magazine-hero-hva-er-utekos'
  )
})

test('fails closed for articles outside the transition allowlist', () => {
  assert.equal(
    getMagazineHeroTransitionName(
      'utekos-techdown-lansering'
    ),
    null
  )
})
