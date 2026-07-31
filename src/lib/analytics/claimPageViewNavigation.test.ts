import assert from 'node:assert/strict'
import test from 'node:test'
import { claimPageViewNavigation } from './claimPageViewNavigation'

test('claims navigations once and ignores same-resource remounts', () => {
  const first = claimPageViewNavigation({
    currentUrl: 'https://utekos.no/',
    documentReferrer: 'https://www.google.com/'
  })
  const remount = claimPageViewNavigation({
    currentUrl: 'https://utekos.no/',
    documentReferrer: 'https://www.google.com/'
  })

  assert.equal(first?.pageUrl, 'https://utekos.no/')
  assert.equal(first?.referrerUrl, 'https://www.google.com/')
  assert.equal(remount, null)

  const navigation = claimPageViewNavigation({
    currentUrl: 'https://utekos.no/kundeservice',
    documentReferrer: 'https://www.google.com/'
  })
  const remountAfterSpa = claimPageViewNavigation({
    currentUrl: 'https://utekos.no/kundeservice',
    documentReferrer: 'https://www.google.com/'
  })

  assert.equal(navigation?.pageUrl, 'https://utekos.no/kundeservice')
  assert.equal(navigation?.referrerUrl, 'https://utekos.no/')
  assert.equal(remountAfterSpa, null)

  assert.ok(
    claimPageViewNavigation({
      currentUrl: 'https://utekos.no/produkter',
      documentReferrer: ''
    })
  )

  assert.equal(
    claimPageViewNavigation({
      currentUrl: 'https://utekos.no/produkter?sort=price',
      documentReferrer: ''
    }),
    null
  )
})
