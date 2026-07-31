import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const config = JSON.parse(
  fs.readFileSync('config/mcp/servers.base.json', 'utf8')
)
const servers = config.mcpServers

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
  assert.equal(facebookAds.tools.length, 82)
  assert.equal(new Set(facebookAds.tools).size, 82)
  assert.ok(
    facebookAds.tools.includes(
      'ads_catalog_get_event_source_catalogs'
    )
  )
  assert.equal(
    facebookAds.tools.includes('ads_catalog_event_source_get'),
    false
  )

  for (const tool of readOnly.tools) {
    assert.equal(
      writeFragments.some(fragment => tool.includes(fragment)),
      false,
      `${tool} must not be exposed by meta-ads-read-only`
    )
  }
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
