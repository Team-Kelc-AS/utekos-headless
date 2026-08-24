import assert from 'node:assert/strict'
import test from 'node:test'
import {
  detectFacebookLoginTraffic,
  isMetaReferrer
} from './facebookLoginTraffic'

test('detects direct Meta ad traffic from fbclid first', () => {
  assert.equal(
    detectFacebookLoginTraffic({
      cookieHeader: '_fbc=fb.1.1780000000000.cookie-click',
      pageUrl: 'https://utekos.no/?fbclid=url-click',
      referrer: 'https://l.facebook.com/'
    }),
    'fbclid'
  )
})

test('detects a valid existing fbc without accepting unrelated cookies', () => {
  assert.equal(
    detectFacebookLoginTraffic({
      cookieHeader: '_fbc=fb.1.1780000000000.meta-click',
      pageUrl: 'https://utekos.no/'
    }),
    'fbc'
  )
  assert.equal(
    detectFacebookLoginTraffic({
      cookieHeader: '_fbc=not-a-meta-cookie',
      pageUrl: 'https://utekos.no/'
    }),
    undefined
  )
})

test('accepts exact Meta hosts and subdomains only', () => {
  assert.equal(
    isMetaReferrer('https://lm.facebook.com/path'),
    true
  )
  assert.equal(
    isMetaReferrer('https://l.instagram.com/path'),
    true
  )
  assert.equal(
    isMetaReferrer('https://facebook.com.attacker.example/path'),
    false
  )
})
