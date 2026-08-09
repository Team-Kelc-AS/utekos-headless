#!/usr/bin/env node

import process from 'node:process'

import {
  Client,
  StdioClientTransport
} from '@modelcontextprotocol/client'

const expectedTools = [
  'get_trends',
  'get_growth',
  'get_top_trends'
]
const live = process.argv.includes('--live')

function inspectTool(tool) {
  const failures = []
  if (!tool.title?.trim()) failures.push('title')
  if (!tool.description?.trim()) failures.push('description')
  if (!tool.inputSchema || tool.inputSchema.type !== 'object') {
    failures.push('inputSchema')
  }
  if (
    !tool.outputSchema ||
    tool.outputSchema.type !== 'object'
  ) {
    failures.push('outputSchema')
  }

  const annotations = tool.annotations ?? {}
  if (!annotations.title?.trim())
    failures.push('annotations.title')
  if (annotations.readOnlyHint !== true) {
    failures.push('annotations.readOnlyHint')
  }
  if (annotations.destructiveHint !== false) {
    failures.push('annotations.destructiveHint')
  }
  if (annotations.idempotentHint !== true) {
    failures.push('annotations.idempotentHint')
  }
  if (annotations.openWorldHint !== true) {
    failures.push('annotations.openWorldHint')
  }

  return { name: tool.name, ok: failures.length === 0, failures }
}

async function main() {
  const transport = new StdioClientTransport(
    live ?
      {
        command: process.execPath,
        args: ['scripts/mcp/run-server.mjs', 'trends-mcp'],
        cwd: process.cwd(),
        stderr: 'inherit'
      }
    : {
        command: process.execPath,
        args: ['scripts/mcp/trendsmcp.js'],
        cwd: process.cwd(),
        env: {
          ...process.env,
          TRENDS_MCP_API_KEY: '',
          TRENDS_MCP_BEARER_TOKEN: ''
        },
        stderr: 'inherit'
      }
  )
  const client = new Client({
    name: 'utekos-trends-mcp-doctor',
    version: '1.0.0'
  })

  try {
    await client.connect(transport)
    const listed = await client.listTools()
    const tools = listed.tools ?? []
    const discoveredTools = tools.map(tool => tool.name).sort()
    const contractChecks = tools
      .filter(tool => expectedTools.includes(tool.name))
      .map(inspectTool)
    const missingTools = expectedTools.filter(
      tool => !discoveredTools.includes(tool)
    )
    const unexpectedTools = discoveredTools.filter(
      tool => !expectedTools.includes(tool)
    )

    const credentialGate =
      live ? null : (
        await client.callTool({
          name: 'get_trends',
          arguments: {
            source: 'google search',
            keyword: 'utekos'
          }
        })
      )
    const credentialGateOk =
      live ||
      (credentialGate?.isError === true &&
        credentialGate.structuredContent?.error?.code ===
          'missing_credentials')

    let liveCheck = null
    if (live) {
      const result = await client.callTool(
        {
          name: 'get_top_trends',
          arguments: {
            type: 'Google Trends',
            limit: 1,
            offset: 0
          }
        },
        undefined,
        { timeout: 60_000 }
      )
      liveCheck = {
        ok:
          result.isError !== true &&
          result.structuredContent?.ok === true &&
          result.structuredContent?.operation ===
            'get_top_trends',
        operation: result.structuredContent?.operation ?? null,
        count: result.structuredContent?.data?.count ?? null,
        provider:
          result.structuredContent?.meta?.provider ?? null,
        error: result.structuredContent?.error ?? null
      }
    }

    const result = {
      ok:
        missingTools.length === 0 &&
        unexpectedTools.length === 0 &&
        contractChecks.every(check => check.ok) &&
        credentialGateOk &&
        (!liveCheck || liveCheck.ok),
      mode: live ? 'live' : 'discovery',
      expectedTools,
      discoveredTools,
      missingTools,
      unexpectedTools,
      contractChecks,
      credentialGate: {
        ok: credentialGateOk,
        code:
          credentialGate?.structuredContent?.error?.code ??
          (live ? 'skipped_in_live_mode' : null)
      },
      liveCheck
    }

    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } finally {
    await client.close().catch(() => {})
  }
}

main().catch(error => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode: live ? 'live' : 'discovery',
        error:
          error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  )
  process.exit(1)
})
