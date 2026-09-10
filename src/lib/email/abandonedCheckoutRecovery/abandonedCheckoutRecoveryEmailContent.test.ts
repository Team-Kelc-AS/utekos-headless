import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAbandonedCheckoutRecoveryEmailContent
} from './abandonedCheckoutRecoveryEmailContent'

const unsubscribeUrl = 'https://utekos.no/unsubscribe?token=test'

test('returns three distinct Norwegian recovery messages', () => {
  const url = 'https://kasse.utekos.no/recover'
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

  assert.match(second.html, /Tilbake til kassen/u)
  assert.match(second.text, /fortsette der du slapp/u)
  assert.doesNotMatch(second.html, /Gavekort 10 %/u)
  assert.doesNotMatch(second.html, /50 % på Comfyrobe/u)

  assert.match(third.html, /Åpne handlekurven/u)
  assert.match(third.text, /siste e-posten/u)
  assert.doesNotMatch(third.html, /50 % på Comfyrobe/u)
  assert.doesNotMatch(third.html, /Gavekort 10 %/u)

  for (const message of messages) {
    assert.match(message.html, /lang="nb"/u)
    assert.match(message.html, /https:\/\/utekos\.no\/HorizontalSVGLogo\.svg/u)
    assert.match(message.html, /#b44701/u)
    assert.match(message.html, /#002521/u)
    assert.match(message.html, /border-radius:12px/u)
    assert.match(message.html, /max-width:600px/u)
    assert.doesNotMatch(message.html, />UTEKOS</u)
    assert.match(message.text, /https:\/\/kasse\.utekos\.no\/recover/u)
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
    'https://kasse.utekos.no/recover?a=1&b=%22token%22'
  const message = getAbandonedCheckoutRecoveryEmailContent({
    step: 1,
    recoveryUrl,
    unsubscribeUrl
  })

  assert.match(message.html, /a=1&amp;b=%22token%22/u)
  assert.match(message.text, new RegExp(recoveryUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
})

test('renders multiple linked line items with responsive Utekos and Shopify images', () => {
  const recoveryUrl = 'https://kasse.utekos.no/recover?token=abc'
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
        imageUrl:
          'https://cdn.shopify.com/s/files/1/comfyrobe.jpg?v=4'
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
  assert.match(
    message.html,
    /https:\/\/cdn\.shopify\.com\/s\/files\/1\/comfyrobe\.jpg\?v=4/u
  )
  assert.match(message.text, /Utekos TechDown, XL/u)
  assert.match(message.text, /Antall 2/u)
  assert.match(message.text, /Comfyrobe/u)
  assert.equal(
    (message.html.match(/<img[\s>]/gu) ?? []).length,
    3
  )
  assert.match(message.html, /https:\/\/utekos\.no\/HorizontalSVGLogo\.svg/u)
  assert.equal(
    (
      message.html.match(
        /href="https:\/\/kasse\.utekos\.no\/recover\?token=abc"[^>]*><img/gu
      ) ?? []
    ).length,
    2
  )
  assert.equal(
    (
      message.html.match(
        /href="https:\/\/kasse\.utekos\.no\/recover\?token=abc"[^>]*style="color:#f0eee9;text-decoration:none;">/gu
      ) ?? []
    ).length,
    2
  )
  assert.equal(
    (message.html.match(/width="72" height="72"/gu) ?? []).length,
    2
  )
  assert.equal(
    (message.html.match(/max-width:100%;height:auto;/gu) ?? []).length,
    2
  )
})

test('rejects unsafe product image URLs', () => {
  for (const imageUrl of [
    'http://utekos.no/email/abandoned-checkout/product.jpg',
    'https://utekos.no/email/abandoned-checkout/product.jpg?',
    'https://utekos.no/email/abandoned-checkout/product.jpg?token=secret',
    'https://utekos.no/email/abandoned-checkout/product.jpg#',
    'https://utekos.no/email/abandoned-checkout/product.jpg#token',
    'https://cdn.shopify.com/s/files/1/product.jpg?',
    'https://cdn.shopify.com/s/files/1/product.jpg?token=secret',
    'https://cdn.shopify.com/s/files/1/product.jpg?v=2&v=3',
    'https://cdn.shopify.com/s/files/1/product.jpg#',
    'https://cdn.shopify.com/s/files/1/product.jpg#token',
    'https://cdn.shopify.com.evil.example/product.jpg',
    'https://user:password@cdn.shopify.com/s/files/1/product.jpg'
  ]) {
    assert.throws(
      () =>
        getAbandonedCheckoutRecoveryEmailContent({
          step: 1,
          recoveryUrl: 'https://kasse.utekos.no/recover',
          unsubscribeUrl,
          lineItems: [
            {
              title: 'Utekos TechDown',
              quantity: 1,
              priceLabel: '1 790,00 kr',
              imageUrl
            }
          ]
        }),
      {
        message: 'abandoned_checkout_recovery_email_content_invalid'
      }
    )
  }
})

test('rejects unsafe or unrelated recovery URLs', () => {
  for (const recoveryUrl of [
    'http://kasse.utekos.no/recover?token=abc',
    'https://evil.example/recover?token=abc',
    'https://kasse.utekos.no:444/recover?token=abc',
    'https://user:password@kasse.utekos.no/recover?token=abc',
    'https://kasse.utekos.no/recover?token=abc#fragment'
  ]) {
    assert.throws(
      () => getAbandonedCheckoutRecoveryEmailContent({
        step: 1,
        recoveryUrl,
        unsubscribeUrl
      }),
      {
        message: 'abandoned_checkout_recovery_email_content_invalid'
      }
    )
  }
})
