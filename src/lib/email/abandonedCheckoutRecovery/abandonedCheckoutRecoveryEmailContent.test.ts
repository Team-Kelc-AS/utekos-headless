import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAbandonedCheckoutRecoveryEmailContent
} from './abandonedCheckoutRecoveryEmailContent'

const unsubscribeUrl = 'https://utekos.no/unsubscribe?token=test'

test('returns three distinct Norwegian recovery messages', () => {
  const url = 'https://checkout.example/recover'
  const messages = [1, 2, 3].map(step =>
    getAbandonedCheckoutRecoveryEmailContent({
      step,
      recoveryUrl: url,
      unsubscribeUrl
    })
  )

  assert.equal(new Set(messages.map(message => message.subject)).size, 3)

  const [first, second, third] = messages
  assert.ok(first)
  assert.ok(second)
  assert.ok(third)

  assert.match(first.html, /Fortsett utsjekkingen/u)
  assert.doesNotMatch(first.html, /Gavekort 10 %/u)
  assert.doesNotMatch(first.html, /50 % på Comfyrobe/u)

  assert.match(second.html, /Hent gavekortet/u)
  assert.match(second.html, /Gavekort 10 %/u)
  assert.match(second.text, /gi det bort/u)
  assert.doesNotMatch(second.html, /50 % på Comfyrobe/u)

  assert.match(third.html, /Hent tilbudene/u)
  assert.match(third.html, /50 % på Comfyrobe/u)
  assert.match(third.html, /Gavekort 10 %/u)
  assert.match(third.text, /50 % på Comfyrobe/u)

  for (const message of messages) {
    assert.match(message.html, /lang="nb"/u)
    assert.match(message.html, /https:\/\/utekos\.no\/HorizontalSVGLogo\.svg/u)
    assert.match(message.html, /#b44701/u)
    assert.match(message.html, /#002521/u)
    assert.match(message.html, /border-radius:12px/u)
    assert.match(message.html, /max-width:600px/u)
    assert.doesNotMatch(message.html, />UTEKOS</u)
    assert.match(message.text, /https:\/\/checkout\.example\/recover/u)
    assert.match(message.text, /samtykket til markedsføring/u)
    assert.match(message.text, /Meld deg av slike e-poster/u)
    assert.doesNotMatch(message.html, /STAYCOMFY/u)
    assert.doesNotMatch(message.html, /kasse\.utekos\.no\/cart/u)
    assert.doesNotMatch(message.html, /\{\{\{RESEND/u)
    assert.doesNotMatch(message.html, /cdn\.shopify/u)
    assert.doesNotMatch(message.html, /#0670DB/u)
    assert.doesNotMatch(message.html, /#c76223/u)
  }
})

test('escapes the recovery URL in HTML without changing the text URL', () => {
  const recoveryUrl =
    'https://checkout.example/recover?a=1&b=%22token%22'
  const message = getAbandonedCheckoutRecoveryEmailContent({
    step: 1,
    recoveryUrl,
    unsubscribeUrl
  })

  assert.match(message.html, /a=1&amp;b=%22token%22/u)
  assert.match(message.text, new RegExp(recoveryUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
})

test('renders first-party line items and omits images without a mapped URL', () => {
  const recoveryUrl = 'https://checkout.example/recover?token=abc'
  const message = getAbandonedCheckoutRecoveryEmailContent({
    step: 1,
    recoveryUrl,
    unsubscribeUrl,
    lineItems: [
      {
        title: 'Utekos TechDown, XL',
        quantity: 2,
        priceLabel: '3 580,00 kr',
        imageUrl: 'https://utekos.no/email/abandoned-checkout/utekos-techdown.jpg'
      },
      {
        title: 'Comfyrobe',
        quantity: 1,
        priceLabel: '1 690,00 kr',
        imageUrl: null
      }
    ]
  })

  assert.match(message.html, /Utekos TechDown, XL/u)
  assert.match(message.html, /Antall 2/u)
  assert.match(message.html, /3 580,00 kr/u)
  assert.match(
    message.html,
    /https:\/\/utekos\.no\/email\/abandoned-checkout\/utekos-techdown\.jpg/u
  )
  assert.match(message.html, /Comfyrobe/u)
  assert.match(message.text, /Utekos TechDown, XL/u)
  assert.match(message.text, /Antall 2/u)
  assert.match(message.text, /Comfyrobe/u)
  assert.equal(
    (message.html.match(/<img[\s>]/gu) ?? []).length,
    2
  )
  assert.match(message.html, /https:\/\/utekos\.no\/HorizontalSVGLogo\.svg/u)
  assert.doesNotMatch(message.html, /cdn\.shopify/u)
})

test('rejects Shopify CDN images on line items', () => {
  assert.throws(
    () =>
      getAbandonedCheckoutRecoveryEmailContent({
        step: 1,
        recoveryUrl: 'https://checkout.example/recover',
        unsubscribeUrl,
        lineItems: [
          {
            title: 'Utekos TechDown',
            quantity: 1,
            priceLabel: '1 790,00 kr',
            imageUrl: 'https://cdn.shopify.com/s/files/1/product.jpg'
          }
        ]
      }),
    {
      message: 'abandoned_checkout_recovery_email_content_invalid'
    }
  )
})
