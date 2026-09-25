import assert from 'node:assert/strict'
import test from 'node:test'
import {
  describeOsCaravanOpenState,
  parseOsCaravanAir,
  parseOsCaravanDrive,
  parseOsCaravanPlace
} from './parseOsCaravanVisitFacts'

test('marks Friday midday as open and Sunday as closed in Oslo', () => {
  assert.equal(
    describeOsCaravanOpenState(new Date('2026-09-25T09:45:00Z')),
    'Åpent nå'
  )
  assert.equal(
    describeOsCaravanOpenState(new Date('2026-09-25T15:00:00Z')),
    'Stengt nå'
  )
  assert.equal(
    describeOsCaravanOpenState(new Date('2026-09-27T10:00:00Z')),
    'Stengt nå'
  )
  assert.equal(
    describeOsCaravanOpenState(new Date('2026-09-24T15:30:00Z')),
    'Åpent nå'
  )
})

test('formats the Google rating and review link', () => {
  const facts = parseOsCaravanPlace({
    rating: 4.7,
    userRatingCount: 39,
    googleMapsLinks: {
      reviewsUri: 'https://www.google.com/maps/reviews'
    }
  })

  assert.equal(facts.ratingLabel, '4,7 · 39 anmeldelser på Google')
  assert.equal(facts.reviewsHref, 'https://www.google.com/maps/reviews')
})

test('formats drive time from Bergen in the Routes locale', () => {
  assert.equal(
    parseOsCaravanDrive({
      routes: [
        {
          localizedValues: {
            distance: { text: '26,4 km' },
            duration: { text: '30 min' }
          }
        }
      ]
    }),
    '30 min og 26,4 km fra Bergen stasjon'
  )
})

test('uses the Norwegian universal air-quality category', () => {
  assert.equal(
    parseOsCaravanAir({
      indexes: [
        { code: 'uaqi', category: 'God luftkvalitet' },
        { code: 'nor_nilu', category: 'Lite' }
      ]
    }),
    'God luftkvalitet'
  )
})
