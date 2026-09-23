import assert from 'node:assert/strict'
import test from 'node:test'
import { techDownReviewBundle } from './productReviews'

test('TechDown keeps Judge.me aggregate independent of visible excerpts', () => {
  assert.deepEqual(techDownReviewBundle.aggregateRating, {
    ratingValue: 4.93,
    reviewCount: 21,
    ratingCount: 21,
    bestRating: 5,
    worstRating: 4
  })
  assert.equal(techDownReviewBundle.reviews.length, 11)
})

test('TechDown excerpts have stable ids and verified Judge.me provenance', () => {
  const ids = techDownReviewBundle.reviews.map(review => review.id)

  assert.equal(new Set(ids).size, ids.length)
  for (const review of techDownReviewBundle.reviews) {
    assert.ok(review.id.length > 0)
    assert.ok(review.ratingValue >= 1 && review.ratingValue <= 5)
    assert.equal(review.verifiedPurchase, true)
    assert.equal(review.source, 'judge-me')
  }
})

test('new review copy is stored verbatim', () => {
  const reviewByAuthor = new Map(
    techDownReviewBundle.reviews.map(review => [review.author, review])
  )

  assert.equal(
    reviewByAuthor.get('Edvin Ole Holstad')?.reviewBody,
    'Fantastisk plagg. Mange som bestiller nå etter Camp Expo på Hellerudsletta.'
  )
  assert.equal(
    reviewByAuthor.get('Per Erik Skei')?.reviewBody,
    'Gave til fruen: Tilbakemeldingen var Meget bra og anbefalte at jeg og bestilte en til meg. Kommer til å bestille 1 stk til.'
  )
  assert.deepEqual(reviewByAuthor.get('Odd Bergesen')?.date, {
    type: 'relativeAgeAtImport',
    observedOn: '2026-09-23',
    months: 2
  })
})
