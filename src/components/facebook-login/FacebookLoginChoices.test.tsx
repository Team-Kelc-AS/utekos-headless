import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { FacebookLoginChoices } from './FacebookLoginChoices'

test('renders one official Meta choice and one Utekos choice only', () => {
  const markup = renderToStaticMarkup(
    <FacebookLoginChoices
      buttonWidth={320}
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
  assert.match(markup, /data-size="medium"/u)
  assert.match(markup, /data-width="320"/u)
  assert.match(markup, /data-scope="public_profile,email"/u)
  assert.match(markup, /style="width:320px"/u)
  assert.equal((markup.match(/h-\[30px\]/gu) ?? []).length, 3)
  assert.match(markup, /gap-3/u)
  assert.match(markup, /text-\[13px\]/u)
  assert.match(markup, /class="flex size-5/u)
  assert.match(markup, /class="size-3/u)
  assert.match(markup, /Fortsett til Utekos/u)
  assert.doesNotMatch(markup, /<form|<input|<h[1-6]/u)
  assert.doesNotMatch(
    markup,
    /Legg til kontaktinformasjon|Prøv igjen|Velkommen fra Facebook/u
  )
})

test('renders a non-interactive Facebook choice for local visual preview', () => {
  const markup = renderToStaticMarkup(
    <FacebookLoginChoices
      buttonWidth={320}
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
  assert.match(markup, /Fortsett med Facebook/u)
  assert.match(markup, /disabled=""/u)
  assert.match(
    markup,
    /Bare visuell forhåndsvisning i lokal utvikling/u
  )
  assert.equal((markup.match(/<button/gu) ?? []).length, 2)
})
