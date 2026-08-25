import assert from 'node:assert/strict'
import test from 'node:test'
import { canUseDisabledFacebookLoginConfig } from './readFacebookLoginRequestConfig'

test('allows a disabled configuration on local preview hosts', () => {
  assert.equal(
    canUseDisabledFacebookLoginConfig({ hostname: 'localhost' }),
    true
  )
})

test('allows a disabled configuration only on an actual Vercel preview deployment', () => {
  assert.equal(
    canUseDisabledFacebookLoginConfig({
      hostname: 'utekos-headless-example.vercel.app',
      vercelEnvironment: 'preview'
    }),
    true
  )
  assert.equal(
    canUseDisabledFacebookLoginConfig({
      hostname: 'utekos-headless-example.vercel.app',
      vercelEnvironment: 'production'
    }),
    false
  )
})

test('never enables disabled configuration on the production domain', () => {
  assert.equal(
    canUseDisabledFacebookLoginConfig({
      hostname: 'utekos.no',
      vercelEnvironment: 'preview'
    }),
    false
  )
})
