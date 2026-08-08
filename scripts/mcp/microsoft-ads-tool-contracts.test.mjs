import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const serverPath = path.join(root, 'scripts/mcp/utekos-microsoft-ads-server.mjs')
const contractPath = path.join(root, 'scripts/mcp/microsoft-ads-tool-contracts.mjs')
const findingPath = path.join(root, 'scripts/microsoft-ads/health/finding-schema.mjs')
const doctorPath = path.join(root, 'scripts/mcp/doctor-utekos-microsoft-ads-server.mjs')

const toolNames = [
  'microsoft_ads_account_snapshot',
  'microsoft_ads_account_health',
  'microsoft_ads_tracking_health',
  'microsoft_ads_merchant_health',
  'microsoft_ads_diagnose',
  'microsoft_ads_recommendations',
  'microsoft_ads_report'
]

test('canonical tool contract module covers all seven tools', () => {
  assert.equal(fs.existsSync(contractPath), true)
  const source = fs.readFileSync(contractPath, 'utf8')
  for (const name of toolNames) assert.match(source, new RegExp(name))
  assert.match(source, /outputSchema/)
  assert.match(source, /annotations/)
  assert.match(source, /no\.utekos\/contractVersion/)
  assert.match(source, /readOnlyHint:\s*true/)
  assert.match(source, /openWorldHint:\s*true/)
})

test('server registers contracts with output schemas and runtime validation', () => {
  const source = fs.readFileSync(serverPath, 'utf8')
  assert.match(source, /MICROSOFT_ADS_TOOL_CONTRACTS/)
  assert.match(source, /MICROSOFT_ADS_TOOL_CONTRACTS\.microsoft_ads_account_snapshot/)
  assert.match(source, /parseMicrosoftAdsToolOutput/)
  assert.match(source, /structuredContent/)
})

test('stable health schemas no longer use unknown or passthrough', () => {
  const source = fs.readFileSync(findingPath, 'utf8')
  assert.doesNotMatch(source, /z\.unknown\(\)/)
  assert.doesNotMatch(source, /\.passthrough\(\)/)
  assert.match(source, /microsoftAdsJsonValueSchema/)
  assert.match(source, /\.strict\(\)/)
})

test('doctor verifies schema and metadata completeness rather than names only', () => {
  const source = fs.readFileSync(doctorPath, 'utf8')
  for (const field of ['outputSchema', 'annotations', 'readOnlyHint', 'openWorldHint', 'no.utekos/contractVersion']) {
    assert.match(source, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('recommendation and report contracts are deliberately bounded', () => {
  const source = fs.readFileSync(contractPath, 'utf8')
  for (const type of [
    'ADD_BROAD_MATCH_KEYWORD',
    'CAMPAIGN_BUDGET',
    'KEYWORD',
    'REMOVE_CONFLICTING_NEGATIVE_KEYWORD',
    'RESPONSIVE_SEARCH_AD',
    'RESPONSIVE_SEARCH_AD_ASSET'
  ]) assert.match(source, new RegExp(type))
  assert.match(source, /predefinedTime cannot be combined with custom dates/)
  assert.match(source, /customStartDate and customEndDate must be provided together/)
  assert.match(source, /ReportDownloadUrl|signed download URLs/)
})

test('tool metadata never embeds credential values or credential metadata keys', () => {
  const source = fs.readFileSync(contractPath, 'utf8')
  for (const forbidden of [
    'MICROSOFT_ADS_CLIENT_SECRET',
    'MICROSOFT_ADS_REFRESH_TOKEN',
    'MICROSOFT_ADS_DEVELOPER_TOKEN',
    'CONTROL_PLANE_API_KEY'
  ]) assert.doesNotMatch(source, new RegExp(forbidden))
})
