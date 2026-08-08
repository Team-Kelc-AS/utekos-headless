import assert from 'node:assert/strict'
import test from 'node:test'

import { filterSentryClientEvent } from './filterSentryClientEvent'

test('drops injected WebView noise from the root Sentry exception', () => {
  const event = {
    type: undefined,
    exception: {
      values: [
        {
          value:
            'window.webkit.messageHandlers.sendDataToNative is undefined'
        }
      ]
    }
  }

  assert.equal(filterSentryClientEvent(event), null)
})

test('keeps an actionable root error when only a linked child contains WebView noise', () => {
  const event = {
    type: undefined,
    exception: {
      values: [
        {
          value:
            'window.webkit.messageHandlers.sendDataToNative is undefined',
          mechanism: {
            type: 'chained',
            exception_id: 1,
            parent_id: 2
          }
        },
        {
          value: 'Checkout failed',
          mechanism: { type: 'generic', exception_id: 2 }
        }
      ]
    }
  }

  assert.equal(filterSentryClientEvent(event), event)
})

test('drops injected WebView noise captured as a top-level Sentry message', () => {
  const event = {
    type: undefined,
    message: 'sendDataToNative is not a function'
  }

  assert.equal(filterSentryClientEvent(event), null)
})

test('drops BotID Kasada stack frames even when the message is generic', () => {
  const event = {
    type: undefined,
    exception: {
      values: [
        {
          value: 'Error',
          stacktrace: {
            frames: [
              {
                filename:
                  'https://utekos.no/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/a-4-a/c.js'
              }
            ]
          }
        }
      ]
    }
  }

  assert.equal(filterSentryClientEvent(event), null)
})
