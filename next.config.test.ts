import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import test from 'node:test'
import type { NextConfig } from 'next'

test('uses the documented Next.js TypeScript config filename', async () => {
  await access(new URL('./next.config.ts', import.meta.url))
  await assert.rejects(
    access(new URL('./next.config.mts', import.meta.url))
  )
})

test('serves security headers globally outside Proxy', async () => {
  const configModulePath = './next.config.ts'
  const { default: nextConfig } = (await import(
    configModulePath
  )) as { default: NextConfig }
  const headersFactory = nextConfig.headers
  if (typeof headersFactory !== 'function') {
    assert.fail('next.config must define global headers')
  }

  const headerRules = await headersFactory()
  const globalRule = headerRules.find(
    rule => rule.source === '/:path*'
  )
  assert.ok(globalRule)

  const headers = new Headers(
    globalRule.headers.map(
      ({ key, value }): [string, string] => [key, value]
    )
  )

  assert.match(
    headers.get('content-security-policy') ?? '',
    /^frame-ancestors 'self'$/u
  )
  assert.equal(headers.get('x-frame-options'), 'SAMEORIGIN')
  assert.doesNotMatch(
    headers.get('content-security-policy-report-only') ?? '',
    /frame-ancestors/u
  )
})

test('permanently redirects legacy Shopify product URLs to public product URLs', async () => {
  const configModulePath = './next.config.ts'
  const { default: nextConfig } = (await import(
    configModulePath
  )) as { default: NextConfig }
  const redirectsFactory = nextConfig.redirects
  if (typeof redirectsFactory !== 'function') {
    assert.fail('next.config must define redirects')
  }

  const redirects = await redirectsFactory()

  assert.deepEqual(
    redirects.find(
      redirect => redirect.source === '/products/:path*'
    ),
    {
      source: '/products/:path*',
      destination: '/produkter/:path*',
      permanent: true
    }
  )
})
