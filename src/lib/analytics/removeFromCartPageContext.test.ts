import assert from 'node:assert/strict'
import test from 'node:test'
import { createPageViewSession } from './pageViewSession'
import { captureRemoveFromCartPageContext } from './removeFromCartPageContext'

test('captures the action page before navigation while Shopify is pending', () => {
  let nextId = 0
  const session = createPageViewSession(() => `page-${++nextId}`)
  const page = {
    pageUrl: 'https://utekos.no/skreddersy-varmen',
    pageTitle: 'Skreddersy varmen',
    documentReferrer: ''
  }
  const captured = captureRemoveFromCartPageContext({
    readPage: () => page,
    session
  })
  page.pageUrl = 'https://utekos.no/'
  page.pageTitle = 'Utekos'
  session.ensure(page)

  assert.equal(
    captured?.pageUrl,
    'https://utekos.no/skreddersy-varmen'
  )
  assert.equal(captured?.pageTitle, 'Skreddersy varmen')
  assert.equal(captured?.pageViewId, 'page-1')
  assert.equal(
    session.get(undefined)?.pageUrl,
    'https://utekos.no/'
  )
  assert.ok(Object.isFrozen(captured))
})

test('failed context capture cannot throw into the cart mutation', () => {
  assert.equal(
    captureRemoveFromCartPageContext({
      readPage: () => {
        throw new Error('Browser context unavailable')
      },
      session: createPageViewSession()
    }),
    undefined
  )
})
