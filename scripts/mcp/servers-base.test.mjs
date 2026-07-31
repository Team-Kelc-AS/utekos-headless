import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const config = JSON.parse(
  fs.readFileSync('config/mcp/servers.base.json', 'utf8')
)
const servers = config.mcpServers
const manifest = JSON.parse(
  fs.readFileSync('config/mcp/credentials.manifest.json', 'utf8')
)
const envExample = fs.readFileSync('.env.mcp.example', 'utf8')

test('keeps Meta write tools out of the read-only surface', () => {
  const facebookAds = servers['facebook-ads']
  const readOnly = servers['meta-ads-read-only']
  const writeFragments = [
    '_activate_',
    '_boost_',
    '_create_',
    '_delete_',
    '_update_'
  ]

  assert.deepEqual(facebookAds.autoApprove, [])
  assert.deepEqual(readOnly.autoApprove, [])
  assert.equal(facebookAds.tools.length, 91)
  assert.equal(new Set(facebookAds.tools).size, 91)

  for (const tool of readOnly.tools) {
    assert.equal(
      writeFragments.some(fragment => tool.includes(fragment)),
      false,
      `${tool} must not be exposed by meta-ads-read-only`
    )
  }
})

test('uses the documented Meta catalog event-source tool names', () => {
  const tools = servers['facebook-ads'].tools

  for (const tool of [
    'ads_catalog_event_source_connect',
    'ads_catalog_event_source_disconnect',
    'ads_catalog_event_source_get',
    'ads_catalog_event_source_get_catalogs',
    'ads_catalog_event_source_get_health',
    'ads_catalog_event_source_get_recommendations',
    'ads_catalog_product_create',
    'ads_catalog_product_feed_delete',
    'ads_catalog_product_feed_delete_rule',
    'ads_catalog_product_set_delete'
  ]) {
    assert.ok(tools.includes(tool), `${tool} must be declared`)
  }

  assert.equal(
    tools.includes('ads_catalog_get_event_source_catalogs'),
    false,
    'ads_catalog_get_event_source_catalogs is not a documented Meta tool'
  )
})

test('declares the full documented Meta Developer Tools surface', () => {
  assert.deepEqual(servers['meta-developer-tools'].tools, [
    'devtools_api_changelog',
    'devtools_api_usage',
    'devtools_app',
    'devtools_app_list',
    'devtools_app_review',
    'devtools_compliance',
    'devtools_discovery',
    'devtools_webhook_list',
    'devtools_webhook_manage',
    'devtools_webhook_test'
  ])
  assert.deepEqual(
    servers['meta-developer-tools'].autoApprove,
    []
  )
})

test('matches the current project-scoped Sentry MCP surface', () => {
  assert.deepEqual(servers.sentry.tools, [
    'analyze_issue_with_seer',
    'execute_sentry_tool',
    'get_sentry_resource',
    'search_events',
    'search_issues',
    'search_sentry_tools',
    'update_issue'
  ])
  assert.deepEqual(servers.sentry.autoApprove, [])
})

test('keeps the Sentry credential contract consistent', () => {
  const sentryKeys = [
    'SENTRY_ACCESS_TOKEN',
    'SENTRY_ORG_TOKEN',
    'SENTRY_ORG',
    'SENTRY_PROJECT'
  ]

  for (const key of sentryKeys) {
    assert.match(
      envExample,
      new RegExp(`^${key}=`, 'm'),
      `${key} must stay declared in .env.mcp.example`
    )
    assert.deepEqual(
      manifest.optionalEnv[key]?.servers,
      ['sentry'],
      `${key} must be owned by the sentry server in credentials.manifest.json`
    )
  }

  assert.equal(manifest.requiredEnv[sentryKeys[1]], undefined)
})

test('keeps secret-bearing keys empty in .env.mcp.example', () => {
  const secretLike = /(TOKEN|SECRET|PASSWORD|_KEY)/
  const pathLike = /(PATH|JSON|FILE|CREDENTIALS)$/

  const populated = envExample
    .split('\n')
    .map(line => line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/))
    .filter(match => match !== null)
    .filter(
      ([, key, value]) =>
        secretLike.test(key) &&
        !pathLike.test(key) &&
        value !== ''
    )
    .map(([, key]) => key)

  assert.deepEqual(
    populated,
    [],
    `secret-bearing keys must stay empty placeholders: ${populated.join(', ')}`
  )
})

test('uses the official privacy-reduced MDN remote MCP', () => {
  assert.equal(servers.mdn.type, 'http')
  assert.equal(servers.mdn.url, 'https://mcp.mdn.mozilla.net/')
  assert.deepEqual(servers.mdn.tools, [
    'get-compat',
    'get-doc',
    'search'
  ])
  assert.equal(
    servers.mdn.headers['X-Moz-1st-Party-Data-Opt-Out'],
    '1'
  )
  assert.deepEqual(servers.mdn.autoApprove, [])
})
