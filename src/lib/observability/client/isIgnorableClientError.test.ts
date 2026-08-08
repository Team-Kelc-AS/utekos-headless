import assert from 'node:assert/strict'
import test from 'node:test'

import { isIgnorableClientError } from './isIgnorableClientError'

test('ignores errors whose script source is a Chrome extension', () => {
  assert.equal(
    isIgnorableClientError({
      message: 'Uncaught DataCloneError: Failed to execute \'postMessage\' on \'Window\'',
      source: 'chrome-extension://dmbjdmncfodongiidmmonmkomhijolad/src/setup.js',
      stack: 'at chrome-extension://dmbjdmncfodongiidmmonmkomhijolad/src/setup.js:27:10'
    }),
    true
  )
})

test('keeps first-party and Clarity errors actionable', () => {
  assert.equal(
    isIgnorableClientError({
      message: 'Uncaught DataCloneError: Failed to execute \'postMessage\' on \'Window\'',
      source: 'https://utekos.no/_next/static/chunks/app.js',
      stack: 'at https://scripts.clarity.ms/0.8.67/clarity.js:2:31578'
    }),
    false
  )
})

test('keeps first-party errors when an extension appears only deeper in the stack', () => {
  assert.equal(
    isIgnorableClientError({
      message: 'First-party failure',
      source: 'https://utekos.no/_next/static/chunks/app.js',
      stack: [
        'at https://utekos.no/_next/static/chunks/app.js:1:1',
        'at chrome-extension://example/content.js:1:1'
      ].join('\n')
    }),
    false
  )
})

test('retains the existing in-app WebView noise filters', () => {
  assert.equal(
    isIgnorableClientError({
      message: 'window.webkit.messageHandlers.sendDataToNative is undefined'
    }),
    true
  )
})

test('ignores BotID Kasada first-party proxy script noise', () => {
  assert.equal(
    isIgnorableClientError({
      message: 'Error',
      source:
        'https://utekos.no/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/a-4-a/c.js?i=0&v=3&h=utekos.no'
    }),
    true
  )
  assert.equal(
    isIgnorableClientError({
      message: 'Error',
      source:
        'https://utekos.no/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/fp?x-kpsdk-v=j-1.2.616'
    }),
    true
  )
})

test('ignores Cookiebot and Summarizer vendor noise by message', () => {
  assert.equal(
    isIgnorableClientError({
      message:
        'Blocked aria-hidden on an element because its descendant retained focus. Element with focus: #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'
    }),
    true
  )
  assert.equal(
    isIgnorableClientError({
      message:
        'Unsupported Summarizer API languages were specified, and the request was aborted.'
    }),
    true
  )
})
