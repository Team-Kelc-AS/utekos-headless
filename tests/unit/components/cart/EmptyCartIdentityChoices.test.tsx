import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmptyCartIdentityChoices } from '@/components/cart/EmptyCart/EmptyCartIdentityChoices'
import {
  KlarnaIdentityButton,
  KLARNA_IDENTITY_BUTTON_THEME
} from '@/components/klarna/components/KlarnaIdentityButton'

test('renders separate official Vipps Login and Klarna Identity choices', () => {
  const markup = renderToStaticMarkup(
    <EmptyCartIdentityChoices />
  )

  assert.match(markup, /<vipps-mobilepay-button/u)
  assert.match(markup, /brand="vipps"/u)
  assert.match(markup, /language="no"/u)
  assert.match(markup, /variant="primary"/u)
  assert.match(markup, /verb="login"/u)
  assert.match(markup, /stretched="true"/u)
  assert.match(markup, /Laster Vipps/u)
  assert.match(markup, /Laster Klarna/u)
  assert.match(markup, /klarna_orig\.svg/u)
  assert.match(markup, /bg-white/u)
  assert.doesNotMatch(markup, /Velg innlogging/u)
  assert.doesNotMatch(markup, /Bekreft identiteten/u)
  assert.doesNotMatch(markup, /Utekos-konto/u)
  assert.match(markup, /min-h-12/u)
  assert.doesNotMatch(
    markup,
    /klarna-identity-button-container/u
  )
  assert.doesNotMatch(markup, /VippsProductExpressCheckout/u)
})

test('delegates Klarna presentation to the official default theme', () => {
  assert.equal(KLARNA_IDENTITY_BUTTON_THEME, 'default')
})

test('two Klarna buttons do not emit a duplicated static DOM id', () => {
  const markup = renderToStaticMarkup(
    <>
      <KlarnaIdentityButton
        width={400}
        onSignIn={() => undefined}
      />
      <KlarnaIdentityButton
        width={400}
        onSignIn={() => undefined}
      />
    </>
  )

  assert.equal((markup.match(/\sid=/gu) ?? []).length, 0)
  assert.equal((markup.match(/Laster Klarna/gu) ?? []).length, 2)
  assert.equal((markup.match(/w-full!/gu) ?? []).length, 2)
})
