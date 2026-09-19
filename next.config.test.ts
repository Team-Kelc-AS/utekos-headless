import assert from 'node:assert/strict'
import test from 'node:test'
import type { NextConfig } from 'next'

test('serves security headers globally outside Proxy', async () => {
  const configModulePath = './next.config.mts'
  const { nextConfig } = (await import(configModulePath)) as {
    nextConfig: NextConfig
  }
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
  const configModulePath = './next.config.mts'
  const { nextConfig } = (await import(configModulePath)) as {
    nextConfig: NextConfig
  }
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

test('proxies Vercel telemetry through first-party paths', async () => {
  const configModulePath = './next.config.mts'
  const { nextConfig } = (await import(configModulePath)) as {
    nextConfig: NextConfig
  }
  const rewritesFactory = nextConfig.rewrites
  if (typeof rewritesFactory !== 'function') {
    assert.fail('next.config must define rewrites')
  }

  const rewrites = await rewritesFactory()
  assert.ok(!Array.isArray(rewrites))
  const beforeFiles = rewrites.beforeFiles
  assert.ok(beforeFiles)

  const telemetryRewrites = beforeFiles.filter(rule =>
    rule.source.startsWith('/telemetry/v1/')
  )

  assert.deepEqual(telemetryRewrites, [
    {
      source: '/telemetry/v1/web.js',
      destination: 'https://utekos.no/_vercel/insights/script.js'
    },
    {
      source: '/telemetry/v1/view',
      destination: 'https://utekos.no/_vercel/insights/view'
    },
    {
      source: '/telemetry/v1/event',
      destination: 'https://utekos.no/_vercel/insights/event'
    },
    {
      source: '/telemetry/v1/speed.js',
      destination:
        'https://utekos.no/_vercel/speed-insights/script.js'
    },
    {
      source: '/telemetry/v1/vitals',
      destination:
        'https://utekos.no/_vercel/speed-insights/vitals'
    }
  ])
})
