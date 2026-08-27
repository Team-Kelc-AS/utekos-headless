import assert from 'node:assert/strict'
import test from 'node:test'
import {
  detectFacebookLoginTraffic,
  isFacebookLoginManualPreview,
  isFacebookLoginPreviewHostname,
  isFacebookLoginPromptActive,
  isMetaReferrer
} from './facebookLoginTraffic'

test('limits the Facebook Login prompt to preview hosts', () => {
  assert.equal(
    isFacebookLoginPreviewHostname(
      'utekos-headless-example.vercel.app'
    ),
    true
  )
  assert.equal(isFacebookLoginPreviewHostname('localhost'), true)
  assert.equal(isFacebookLoginPreviewHostname('utekos.no'), false)
  assert.equal(
    isFacebookLoginPreviewHostname('www.utekos.no'),
    false
  )
})

test('never activates the Facebook Login prompt on production hosts', () => {
  assert.equal(
    isFacebookLoginPromptActive({
      enabled: true,
      hostname: 'utekos.no',
      previewAllowed: false
    }),
    false
  )
  assert.equal(
    isFacebookLoginPromptActive({
      enabled: true,
      hostname: 'www.utekos.no',
      previewAllowed: true
    }),
    false
  )
  assert.equal(
    isFacebookLoginPromptActive({
      enabled: false,
      hostname: 'utekos-headless-example.vercel.app',
      previewAllowed: true
    }),
    true
  )
})

test('allows the manual prompt override only on preview hosts', () => {
  assert.equal(
    isFacebookLoginManualPreview({
      hostname: 'utekos-headless-example.vercel.app',
      pageUrl:
        'https://utekos-headless-example.vercel.app/?facebook_login_preview=1'
    }),
    true
  )
  assert.equal(
    isFacebookLoginManualPreview({
      hostname: 'utekos.no',
      pageUrl:
        'https://utekos.no/?facebook_login_preview=1'
    }),
    false
  )
})

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
