import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { readStorefrontGatewayEnvironment } from './readStorefrontGatewayEnvironment'

test('reads Storefront credentials from static process.env members', () => {
  const originalPrivate = process.env.PRIVATE_STOREFRONT_ACCESS_TOKEN
  const originalPublic = process.env.STOREFRONT_API_ACCESS_TOKEN
  const originalDomain = process.env.STORE_DOMAIN

  process.env.STORE_DOMAIN = 'example.myshopify.com'
  process.env.STOREFRONT_API_ACCESS_TOKEN = 'public-token'
  process.env.PRIVATE_STOREFRONT_ACCESS_TOKEN = 'shpss_private-token'

  try {
    const environment = readStorefrontGatewayEnvironment()

    assert.equal(environment.STORE_DOMAIN, 'example.myshopify.com')
    assert.equal(
      environment.STOREFRONT_API_ACCESS_TOKEN,
      'public-token'
    )
    assert.equal(
      environment.PRIVATE_STOREFRONT_ACCESS_TOKEN,
      'shpss_private-token'
    )
  } finally {
    restoreEnv('STORE_DOMAIN', originalDomain)
    restoreEnv('STOREFRONT_API_ACCESS_TOKEN', originalPublic)
    restoreEnv('PRIVATE_STOREFRONT_ACCESS_TOKEN', originalPrivate)
  }
})

test('keeps literal process.env Storefront credential members for Next.js', async () => {
  const source = await readFile(
    new URL('./readStorefrontGatewayEnvironment.ts', import.meta.url),
    'utf8'
  )
  const gatewaySource = await readFile(
    new URL('./storefrontGateway.server.ts', import.meta.url),
    'utf8'
  )

  for (const name of [
    'process.env.STORE_DOMAIN',
    'process.env.STOREFRONT_API_ACCESS_TOKEN',
    'process.env.VERCEL_SHOPIFY_STOREFRONT_ACCESS_TOKEN',
    'process.env.NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN',
    'process.env.PRIVATE_STOREFRONT_ACCESS_TOKEN',
    'process.env.STOREFRONT_API_PRIVATE_ACCESS_TOKEN',
    'process.env.PRIVATE_STOREFRONT_API_TOKEN'
  ]) {
    assert.match(
      source,
      new RegExp(name.replaceAll('.', '\\.')),
      `${name} must be a static member access so Next.js can include it in cached server scopes`
    )
  }

  assert.doesNotMatch(
    source,
    /process\.env\[/,
    'dynamic process.env lookups are not inlined by Next.js'
  )
  assert.match(
    gatewaySource,
    /readStorefrontGatewayEnvironment\(\)/
  )
  assert.doesNotMatch(
    gatewaySource,
    /createStorefrontGatewayFromEnvironment\(\s*process\.env\s*\)/
  )
})

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}
