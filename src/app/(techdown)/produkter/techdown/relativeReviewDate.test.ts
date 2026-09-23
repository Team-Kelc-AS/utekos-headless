import assert from 'node:assert/strict'
import test from 'node:test'
import type { ProductReviewDate } from '@/db/data/reviews/productReviews'
import {
  formatExactReviewAge,
  formatReviewAge,
  millisecondsUntilNextOsloMidnight
} from './relativeReviewDate'

const dateInOslo = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00+02:00`)

test('exact ages follow Judge.me day, month and year buckets', () => {
  const now = dateInOslo('2026-09-23')
  const cases: [string, string][] = [
    ['2026-09-23', 'I dag'],
    ['2026-09-22', '1 dag siden'],
    ['2026-09-21', '2 dager siden'],
    ['2026-08-24', '30 dager siden'],
    ['2026-08-23', 'En måned siden'],
    ['2026-07-26', 'En måned siden'],
    ['2026-07-25', '2 måneder siden'],
    ['2026-06-26', '2 måneder siden'],
    ['2026-06-25', '3 måneder siden'],
    ['2025-09-24', '12 måneder siden'],
    ['2025-09-23', 'Ett år siden'],
    ['2024-09-23', '2 år siden']
  ]

  for (const [published, expected] of cases) {
    assert.equal(formatExactReviewAge(published, now), expected)
  }
})

test('Edvin and Per advance at Oslo calendar midnight', () => {
  assert.equal(
    formatExactReviewAge('2026-09-22', dateInOslo('2026-09-24')),
    '2 dager siden'
  )
  assert.equal(
    formatExactReviewAge('2026-08-24', dateInOslo('2026-09-24')),
    'En måned siden'
  )
  assert.equal(
    formatExactReviewAge('2026-08-24', dateInOslo('2026-09-23')),
    '30 dager siden'
  )
})

test('month-only imports never require a fabricated publication date', () => {
  const date: ProductReviewDate = {
    type: 'relativeAgeAtImport',
    observedOn: '2026-09-23',
    months: 2
  }

  assert.equal(
    formatReviewAge(date, dateInOslo('2026-09-23')),
    '2 måneder siden'
  )
  assert.equal('datePublished' in date, false)
})

test('next Oslo midnight accounts for daylight-saving transitions', () => {
  const beforeSummerTime = new Date('2026-03-29T00:30:00+01:00')
  const beforeWinterTime = new Date('2026-10-25T00:30:00+02:00')

  assert.equal(
    millisecondsUntilNextOsloMidnight(beforeSummerTime),
    81_000_100
  )
  assert.equal(
    millisecondsUntilNextOsloMidnight(beforeWinterTime),
    88_200_100
  )
})
