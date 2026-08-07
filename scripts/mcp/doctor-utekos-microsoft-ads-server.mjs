#!/usr/bin/env node

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { Client, StdioClientTransport } from '@modelcontextprotocol/client'

import { redactMicrosoftAdsSecrets } from '../microsoft-ads/lib/http.mjs'
import { UTEKOS_MICROSOFT_ADS_MCP_TOOLS } from './utekos-microsoft-ads-server.mjs'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const serverPath = path.join(moduleDir, 'utekos-microsoft-ads-server.mjs')
const live = process.argv.includes('--live')

main().catch(error => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode: live ? 'live' : 'discovery',
        error: redactMicrosoftAdsSecrets(
          error instanceof Error ? error.message : String(error)
        )
      },
      null,
      2
    )
  )
  process.exitCode = 1
})

async function main() {
  const client = new Client({
    name: 'utekos-microsoft-ads-doctor',
    version: '1.0.0'
  })

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: process.env
  })

  try {
    await client.connect(transport)

    const tools = await listAllTools(client)
    const discoveredNames = tools.map(tool => tool.name).sort()
    const expectedNames = [...UTEKOS_MICROSOFT_ADS_MCP_TOOLS].sort()
    const missingTools = expectedNames.filter(
      name => !discoveredNames.includes(name)
    )
    const unexpectedTools = discoveredNames.filter(
      name => !expectedNames.includes(name)
    )

    const liveChecks = live ? await runLiveChecks(client) : null
    const liveErrors = liveChecks
      ? Object.entries(liveChecks)
          .filter(([, check]) => check.isError)
          .map(([name]) => name)
      : []

    const result = {
      ok: missingTools.length === 0 && liveErrors.length === 0,
      mode: live ? 'live' : 'discovery',
      serverPath,
      expectedToolCount: expectedNames.length,
      discoveredToolCount: discoveredNames.length,
      expectedTools: expectedNames,
      discoveredTools: discoveredNames,
      missingTools,
      unexpectedTools,
      liveChecks,
      liveErrors
    }

    console.log(JSON.stringify(result, null, 2))

    if (!result.ok) {
      process.exitCode = 1
    }
  } finally {
    await client.close().catch(() => {})
  }
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

async function runLiveChecks(client) {
  const checks = [
    {
      key: 'snapshot',
      name: 'microsoft_ads_account_snapshot',
      arguments: { refresh: true, detail: 'summary' }
    },
    {
      key: 'accountHealth',
      name: 'microsoft_ads_account_health',
      arguments: { refresh: false }
    },
    {
      key: 'trackingHealth',
      name: 'microsoft_ads_tracking_health',
      arguments: { refresh: false }
    },
    {
      key: 'merchantHealth',
      name: 'microsoft_ads_merchant_health',
      arguments: { refresh: false }
    }
  ]

  const results = {}

  for (const check of checks) {
    const result = await client.callTool(
      {
        name: check.name,
        arguments: check.arguments
      },
      { timeout: 180_000 }
    )

    results[check.key] = {
      tool: check.name,
      isError: Boolean(result.isError),
      result: extractToolPayload(result)
    }
  }

  return results
}

function extractToolPayload(result) {
  if (
    result?.structuredContent &&
    typeof result.structuredContent === 'object'
  ) {
    return result.structuredContent
  }

  const textItem = (result?.content ?? []).find(
    item => item?.type === 'text' && typeof item.text === 'string'
  )

  if (!textItem) {
    return null
  }

  try {
    return JSON.parse(textItem.text)
  } catch {
    return textItem.text
  }
}
