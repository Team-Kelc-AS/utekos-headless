import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { FacebookLoginChoices } from '@/components/facebook-login/FacebookLoginChoices'

test('renders the official Meta and Klarna choices', () => {
  const markup = renderToStaticMarkup(
    <FacebookLoginChoices
      buttonWidth={400}
      buttonContainerRef={{ current: null }}
      buttonRendered
      loginUnavailable={false}
      onContinueWithoutFacebook={() => undefined}
      pending={false}
      sdkReady
    />
  )

  assert.equal(
    (markup.match(/class="fb-login-button w-full"/gu) ?? [])
      .length,
    1
  )
  assert.equal((markup.match(/<button/gu) ?? []).length, 1)
  assert.match(markup, /data-button-type="continue_with"/u)
  assert.match(markup, /data-use-continue-as="true"/u)
  assert.match(markup, /data-size="large"/u)
  assert.match(markup, /data-width="366"/u)
  assert.match(markup, /data-scope="public_profile,email"/u)
  assert.match(markup, /style="width:400px"/u)
  assert.match(markup, /top-1\/2/u)
  assert.match(markup, /data-slot="card"/u)
  assert.match(markup, /data-slot="card-content"/u)
  assert.match(markup, /data-slot="card-footer"/u)
  assert.match(markup, /bg-white/u)
  assert.match(
    markup,
    /flex h-12 w-full items-center justify-center/u
  )
  assert.doesNotMatch(
    markup,
    /klarna-identity-button-container/u
  )
  assert.match(markup, /Laster Klarna/u)
  assert.match(markup, /bg-\[#FFA8CD\]/u)
  assert.match(markup, /klarna_orig\.svg/u)
  assert.match(markup, /Fortsett uten innlogging/u)
  assert.doesNotMatch(markup, /Fortsett til Utekos/u)
  assert.doesNotMatch(markup, /<form|<input|<h[1-6]/u)
  assert.doesNotMatch(
    markup,
    /Legg til kontaktinformasjon|Prøv igjen|Velkommen fra Facebook/u
  )
})

test('renders a non-interactive Facebook choice for local visual preview', () => {
  const markup = renderToStaticMarkup(
    <FacebookLoginChoices
      buttonWidth={400}
      buttonContainerRef={{ current: null }}
      buttonRendered={false}
      loginUnavailable={false}
      onContinueWithoutFacebook={() => undefined}
      pending={false}
      sdkReady={false}
      visualPreview
    />
  )

  assert.doesNotMatch(markup, /fb-login-button/u)
  assert.match(markup, /Logg inn med Facebook/u)
  assert.doesNotMatch(markup, /Fortsett som \[navn\]/u)
  assert.match(markup, /data-slot="card"/u)
  assert.match(markup, /data-slot="button"/u)
  assert.match(markup, /h-12 w-full/u)
  assert.match(markup, /top-1\/2/u)
  assert.match(markup, /disabled=""/u)
  assert.match(
    markup,
    /Bare visuell forhåndsvisning i lokal utvikling/u
  )
  assert.match(markup, /inline-flex items-center gap-2/u)
  assert.match(markup, /facebook-logo-secondary\.png/u)
  assert.match(markup, /width="24" height="24"/u)
  assert.match(markup, /bg-\[#1877F2\]/u)
  assert.doesNotMatch(
    markup,
    /klarna-identity-button-container/u
  )
  assert.match(markup, /Laster Klarna/u)
  assert.match(markup, /inert=""/u)
  assert.equal((markup.match(/<button/gu) ?? []).length, 2)
})
