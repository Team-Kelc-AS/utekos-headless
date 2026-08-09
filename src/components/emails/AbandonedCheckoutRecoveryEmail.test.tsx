import assert from 'node:assert/strict'
import test from 'node:test'

import { render } from '@react-email/render'
import { createElement } from 'react'

import {
  AbandonedCheckoutRecoveryEmail,
  getAbandonedCheckoutRecoverySubject
} from './AbandonedCheckoutRecoveryEmail'

const urls = {
  recoveryUrl: 'https://checkout.shopify.com/recover/opaque-token',
  unsubscribeUrl: 'https://utekos.no/avmelding?token=opaque'
}

test('renders the three locked subjects', () => {
  assert.deepEqual(
    ([1, 2, 3] as const).map(getAbandonedCheckoutRecoverySubject),
    [
      'Glemte du noe i kassen?',
      'Handlekurven din venter fortsatt',
      'Siste påminnelse om handlekurven din'
    ]
  )
})

test('generic recovery omits the STAYCOMFY offer', async () => {
  const html = await render(
    createElement(AbandonedCheckoutRecoveryEmail, {
      step: 1,
      offerType: 'generic',
      ...urls
    })
  )

  assert.match(html, /Fortsett til kassen/)
  assert.doesNotMatch(html, /STAYCOMFY|200 kr rabatt/)
})

test('Comfyrobe recovery includes the offer and unsubscribe link', async () => {
  const html = await render(
    createElement(AbandonedCheckoutRecoveryEmail, {
      step: 3,
      offerType: 'staycomfy',
      ...urls
    })
  )

  assert.match(html, /200 kr rabatt per Comfyrobe \+ gratis frakt/)
  assert.match(html, /STAYCOMFY/)
  assert.match(html, /Meld deg av/)
})
