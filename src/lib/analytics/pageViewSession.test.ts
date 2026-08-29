import assert from 'node:assert/strict'
import test from 'node:test'
import { createPageViewSession } from './pageViewSession'

test('reuses one page_view_id for the same canonical URL', () => {
  const ids = ['0c955d6b-5e9c-47d0-b304-046df7f4bf7f']

  const session = createPageViewSession(() => {
    const id = ids.shift()

    if (!id) {
      throw new Error('missing test id')
    }

    return id
  })

  const first = session.ensure({
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    documentReferrer: 'https://www.google.com/'
  })

  const repeated = session.ensure({
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    documentReferrer: 'https://www.example.com/'
  })

  assert.equal(repeated.pageViewId, first.pageViewId)

  assert.equal(repeated.referrerUrl, 'https://www.google.com/')
})

test('uses the preceding application URL as the SPA referrer', () => {
  const ids = [
    '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  ]

  const session = createPageViewSession(() => {
    const id = ids.shift()

    if (!id) {
      throw new Error('missing test id')
    }

    return id
  })

  session.ensure({
    pageUrl: 'https://utekos.no/produkter',
    documentReferrer: 'https://www.google.com/'
  })

  const product = session.ensure({
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    documentReferrer: 'https://www.google.com/'
  })

  assert.equal(
    product.referrerUrl,
    'https://utekos.no/produkter'
  )

  assert.equal(
    product.pageViewId,
    'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  )

  assert.equal(
    product.previousPageViewId,
    '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )

  assert.deepEqual(session.get(product.pageViewId), product)
})

test('records the emitted page_view id and notifies subscribers once', () => {
  const session = createPageViewSession(
    () => '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )

  const provisional = session.ensure({
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    documentReferrer: ''
  })

  const emittedIds: string[] = []

  const unsubscribe = session.subscribe(pageView => {
    emittedIds.push(pageView.pageViewId)
  })

  const emitted = {
    pageUrl: provisional.pageUrl,
    pageViewId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    ...(provisional.referrerUrl ?
      { referrerUrl: provisional.referrerUrl }
    : {})
  }

  assert.equal(session.hasEmitted(provisional.pageViewId), false)

  assert.equal(session.recordEmitted(emitted), true)

  assert.equal(session.recordEmitted(emitted), false)

  assert.equal(session.hasEmitted(emitted.pageViewId), true)

  assert.equal(session.hasEmitted(provisional.pageViewId), false)

  assert.deepEqual(emittedIds, [emitted.pageViewId])

  assert.equal(
    session.ensure({ pageUrl: emitted.pageUrl }).pageViewId,
    emitted.pageViewId
  )

  unsubscribe()
})

test('ignores an invalid document referrer', () => {
  const session = createPageViewSession(
    () => '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )

  const context = session.ensure({
    pageUrl: 'https://utekos.no/',
    documentReferrer: 'not-a-url'
  })

  assert.equal(context.referrerUrl, undefined)
})
