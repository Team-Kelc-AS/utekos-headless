import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAbandonedCheckoutRecoveryEmailContent
} from './abandonedCheckoutRecoveryEmailContent'

test('returns three distinct Norwegian recovery messages', () => {
  const url = 'https://checkout.example/recover'
  const messages = [1, 2, 3].map(step =>
    getAbandonedCheckoutRecoveryEmailContent({
      step,
      recoveryUrl: url,
      unsubscribeUrl: 'https://utekos.no/unsubscribe?token=test'
    })
  )

  assert.equal(new Set(messages.map(message => message.subject)).size, 3)

  for (const message of messages) {
    assert.match(message.html, /Fortsett utsjekkingen/u)
    assert.match(message.text, /https:\/\/checkout\.example\/recover/u)
    assert.match(message.text, /samtykket til markedsføring/u)
    assert.match(message.text, /Meld deg av slike e-poster/u)
  }
})

test('escapes the recovery URL in HTML without changing the text URL', () => {
  const recoveryUrl =
    'https://checkout.example/recover?a=1&b=%22token%22'
  const message = getAbandonedCheckoutRecoveryEmailContent({
    step: 1,
    recoveryUrl,
    unsubscribeUrl: 'https://utekos.no/unsubscribe?token=test'
  })

  assert.match(message.html, /a=1&amp;b=%22token%22/u)
  assert.match(message.text, new RegExp(recoveryUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
})
