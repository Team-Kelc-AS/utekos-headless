import assert from 'node:assert/strict'
import test from 'node:test'
import { createInternalJourneyContextEnricher } from '@/lib/analytics/internalJourneyContext'
import { createJourneySession } from './createJourneySession'

const journey1 = '11111111-1111-4111-8111-111111111111'
const journey2 = '22222222-2222-4222-8222-222222222222'
const page1 = '33333333-3333-4333-8333-333333333333'
const page2 = '44444444-4444-4444-8444-444444444444'
const accepted = {
  hasResponse: true,
  consent: {
    method: 'explicit',
    statistics: true,
    marketing: true
  }
}
const landing = {
  pageUrl:
    'https://utekos.no/skreddersy-varmen?utm_source=facebook&utm_content=123456789012&email=private@example.com',
  pageViewId: page1
}

function fixture(blocked = false) {
  let sequence = 0
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    }
  }
  const getStorage = () => {
    if (blocked) throw new Error('SecurityError')
    return storage
  }
  const enrich = createInternalJourneyContextEnricher({
    createId: () => (sequence++ === 0 ? journey1 : journey2),
    getStorage,
    getPreviousPageViewId: () => undefined
  })
  return {
    session: createJourneySession({ enrich, getStorage }),
    values
  }
}

test('missing, unknown, implied, statistics-only and marketing-only consent never open an advertising-linked journey', () => {
  for (const cookiebot of [
    undefined,
    {
      hasResponse: true,
      consent: {
        method: 'explicit',
        statistics: true,
        marketing: false
      }
    },
    {
      hasResponse: true,
      consent: {
        method: 'implied',
        statistics: true,
        marketing: true
      }
    },
    { hasResponse: false, consent: { statistics: true } },
    {
      hasResponse: true,
      consent: { statistics: false, marketing: true }
    }
  ]) {
    const { session, values } = fixture()
    assert.equal(
      session.open({ cookiebot, pageView: landing }),
      undefined
    )
    assert.equal(values.size, 0)
  }
})

test('late explicit statistics plus marketing consent starts fresh observations with validated UTM labels', () => {
  const { session } = fixture()
  session.open({ cookiebot: undefined, pageView: landing })
  const page = session.open({
    cookiebot: accepted,
    pageView: landing
  })!
  assert.equal(page.journeyId, journey1)
  assert.deepEqual(page.utm, { utm_source: 'facebook' })
  assert.equal(page.maxScrollY, 0)
  assert.equal(page.sections.size, 0)
  assert.equal(page.consent.marketing, 'granted')
  assert.equal(page.pagePath, '/skreddersy-varmen')
  assert.equal(
    session.open({ cookiebot: accepted, pageView: landing }),
    page
  )
})

test('internal navigation reuses the journey and links only measured pages', () => {
  const { session } = fixture()
  session.open({ cookiebot: accepted, pageView: landing })
  const next = session.open({
    cookiebot: accepted,
    pageView: {
      pageUrl: 'https://utekos.no/produkter/utekos-dun',
      pageViewId: page2
    }
  })!
  assert.equal(next.journeyId, journey1)
  assert.equal(next.previousPageViewId, page1)
  assert.equal(next.utm, undefined)
})

test('withdrawal destroys the cohort and a later grant creates a new unlinked journey', () => {
  const { session, values } = fixture()
  const old = session.open({
    cookiebot: accepted,
    pageView: landing
  })!
  old.sections.add('purchase')
  old.maxScrollY = 1000
  session.revoke()
  assert.equal(values.size, 0)
  const fresh = session.open({
    cookiebot: accepted,
    pageView: landing
  })!
  assert.equal(fresh.journeyId, journey2)
  assert.equal(fresh.maxScrollY, 0)
  assert.equal(fresh.sections.size, 0)
  assert.equal(fresh.previousPageViewId, undefined)
})

test('blocked storage preserves same-tab navigation in memory', () => {
  const { session } = fixture(true)
  const first = session.open({
    cookiebot: accepted,
    pageView: landing
  })!
  const next = session.open({
    cookiebot: accepted,
    pageView: {
      pageUrl: 'https://utekos.no/produkter',
      pageViewId: page2
    }
  })!
  assert.equal(next.journeyId, first.journeyId)
})

test('unqualified pages do not start cohorts; invalid and duplicate UTM fields are excluded', () => {
  const { session } = fixture()
  for (const path of [
    '/produkter?utm_source=facebook',
    '/skreddersy-varmen',
    '/skreddersy-varmen?utm_source=private@example.com',
    '/skreddersy-varmen?utm_source=x&utm_source=y'
  ]) {
    assert.equal(
      session.open({
        cookiebot: accepted,
        pageView: {
          ...landing,
          pageUrl: `https://utekos.no${path}`
        }
      }),
      undefined
    )
  }
})
