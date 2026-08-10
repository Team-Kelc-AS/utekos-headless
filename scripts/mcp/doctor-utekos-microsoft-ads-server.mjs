#!/usr/bin/env node

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Client, StdioClientTransport } from '@modelcontextprotocol/client'
import { redactMicrosoftAdsSecrets } from '../microsoft-ads/lib/http.mjs'
import { UTEKOS_MICROSOFT_ADS_MCP_TOOLS } from './utekos-microsoft-ads-server.mjs'
import { MICROSOFT_ADS_TOOL_CONTRACT_VERSION } from './microsoft-ads-tool-contracts.mjs'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const serverPath = path.join(moduleDir, 'utekos-microsoft-ads-server.mjs')
const live = process.argv.includes('--live')
const accountId = parseAccountIdArgument(process.argv)
const REQUIRED_META_KEY = 'no.utekos/contractVersion'

main().catch(error => {
  console.error(JSON.stringify({
    ok: false,
    mode: live ? 'live' : 'discovery',
    error: redactMicrosoftAdsSecrets(error instanceof Error ? error.message : String(error))
  }, null, 2))
  process.exitCode = 1
})

async function main() {
  const client = new Client({ name: 'utekos-microsoft-ads-doctor', version: '1.2.0' })
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], env: process.env })
  try {
    await client.connect(transport)
    const tools = await listAllTools(client)
    const discoveredNames = tools.map(tool => tool.name).sort()
    const expectedNames = [...UTEKOS_MICROSOFT_ADS_MCP_TOOLS].sort()
    const missingTools = expectedNames.filter(name => !discoveredNames.includes(name))
    const unexpectedTools = discoveredNames.filter(name => !expectedNames.includes(name))
    const contractChecks = tools
      .filter(tool => expectedNames.includes(tool.name))
      .map(inspectToolContract)
    const contractErrors = contractChecks.filter(check => !check.ok).map(check => check.name)
    const liveChecks = live ? await runLiveChecks(client, accountId) : null
    const liveErrors = liveChecks
      ? Object.entries(liveChecks)
          .filter(([, check]) =>
            check.isError ||
            !check.hasStructuredContent ||
            check.resultMetaContractVersion !== MICROSOFT_ADS_TOOL_CONTRACT_VERSION
          )
          .map(([name]) => name)
      : []
    const result = {
      ok: missingTools.length === 0 && unexpectedTools.length === 0 && contractErrors.length === 0 && liveErrors.length === 0,
      mode: live ? 'live' : 'discovery',
      accountId: accountId ?? 'primary',
      serverPath,
      expectedToolCount: expectedNames.length,
      discoveredToolCount: discoveredNames.length,
      expectedTools: expectedNames,
      discoveredTools: discoveredNames,
      missingTools,
      unexpectedTools,
      contractChecks,
      contractErrors,
      liveChecks,
      liveErrors
    }
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } finally {
    await client.close().catch(() => {})
  }
}

function inspectToolContract(tool) {
  const failures = []
  if (!tool.title?.trim()) failures.push('title')
  if (!tool.description?.trim()) failures.push('description')
  if (!isObjectSchema(tool.inputSchema)) failures.push('inputSchema')
  if (!tool.outputSchema || typeof tool.outputSchema !== 'object') failures.push('outputSchema')
  const annotations = tool.annotations ?? {}
  if (!annotations.title?.trim()) failures.push('annotations.title')
  if (annotations.readOnlyHint !== true) failures.push('annotations.readOnlyHint')
  if (annotations.destructiveHint !== false) failures.push('annotations.destructiveHint')
  if (annotations.idempotentHint !== true) failures.push('annotations.idempotentHint')
  if (annotations.openWorldHint !== true) failures.push('annotations.openWorldHint')
  if (tool._meta?.[REQUIRED_META_KEY] !== MICROSOFT_ADS_TOOL_CONTRACT_VERSION) failures.push(REQUIRED_META_KEY)
  return {
    name: tool.name,
    ok: failures.length === 0,
    failures,
    hasOutputSchema: Boolean(tool.outputSchema),
    annotations: {
      readOnlyHint: annotations.readOnlyHint ?? null,
      destructiveHint: annotations.destructiveHint ?? null,
      idempotentHint: annotations.idempotentHint ?? null,
      openWorldHint: annotations.openWorldHint ?? null
    },
    contractVersion: tool._meta?.[REQUIRED_META_KEY] ?? null
  }
}

function isObjectSchema(schema) {
  return Boolean(schema && typeof schema === 'object' && (schema.type === 'object' || schema.properties || schema.oneOf || schema.anyOf))
}

async function listAllTools(client) {
  const tools = []
  let cursor
  do {
    const page = await client.listTools(cursor ? { cursor } : {})
    tools.push(...(page.tools ?? []))
    cursor = page.nextCursor
  } while (cursor)
  return tools
}

async function runLiveChecks(client, accountId) {
  const accountSelection = accountId ? { accountId } : {}
  const checks = [
    {
      key: 'snapshotSummary',
      name: 'microsoft_ads_account_snapshot',
      arguments: { ...accountSelection, refresh: true, detail: 'summary' }
    },
    {
      key: 'snapshotFull',
      name: 'microsoft_ads_account_snapshot',
      arguments: { ...accountSelection, refresh: false, detail: 'full' }
    },
    {
      key: 'accountHealth',
      name: 'microsoft_ads_account_health',
      arguments: { ...accountSelection, refresh: false }
    },
    {
      key: 'trackingHealth',
      name: 'microsoft_ads_tracking_health',
      arguments: { ...accountSelection, refresh: false }
    },
    {
      key: 'merchantHealth',
      name: 'microsoft_ads_merchant_health',
      arguments: { ...accountSelection, refresh: false }
    },
    {
      key: 'diagnose',
      name: 'microsoft_ads_diagnose',
      arguments: {
        ...accountSelection,
        query: 'paid clicks but zero qualified conversions and Merchant Center issues',
        area: 'auto',
        refresh: false,
        maxFindings: 5
      }
    },
    {
      key: 'recommendations',
      name: 'microsoft_ads_recommendations',
      arguments: { ...accountSelection, refresh: false, limit: 5 }
    },
    {
      key: 'report',
      name: 'microsoft_ads_report',
      arguments: {
        ...accountSelection,
        reportType: 'CampaignPerformanceReportRequest',
        aggregation: 'Summary',
        columns: [
          'AccountId',
          'CampaignId',
          'CampaignName',
          'CampaignStatus',
          'CampaignType',
          'Impressions',
          'Clicks',
          'Spend'
        ],
        predefinedTime: 'LastSevenDays',
        rowLimit: 5,
        returnOnlyCompleteData: false
      },
      timeout: 300_000
    }
  ]
  const results = {}
  for (const check of checks) {
    const result = await client.callTool(
      { name: check.name, arguments: check.arguments },
      { timeout: check.timeout ?? 180_000 }
    )
    results[check.key] = {
      tool: check.name,
      isError: Boolean(result.isError),
      hasStructuredContent: Boolean(result.structuredContent),
      resultMetaContractVersion: result?._meta?.[REQUIRED_META_KEY] ?? null,
      result: extractToolPayload(result)
    }
  }
  return results
}

function parseAccountIdArgument(argv) {
  const value = argv
    .find(argument => argument.startsWith('--account-id='))
    ?.slice('--account-id='.length)

  if (!value) {
    return null
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('--account-id must contain digits only.')
  }

  return value
}

function extractToolPayload(result) {
  if (result?.structuredContent && typeof result.structuredContent === 'object') return result.structuredContent
  const textItem = (result?.content ?? []).find(item => item?.type === 'text' && typeof item.text === 'string')
  if (!textItem) return null
  try { return JSON.parse(textItem.text) } catch { return textItem.text }
}
