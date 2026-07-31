#!/usr/bin/env node

import process from 'node:process'

import {
  Client,
  StdioClientTransport
} from '@modelcontextprotocol/client'

const expectedTools = [
  'insight_bootstrap',
  'read_context_bundle',
  'tool_inventory',
  'connector_surface_audit',
  'safe_git_overview',
  'project_locate',
  'read_project_files'
]

function check(checks, name, ok, message) {
  checks.push({ name, ok, message })
}

function printChecks(checks) {
  for (const item of checks) {
    console.log(
      `${item.ok ? 'PASS' : 'FAIL'} ${item.name.padEnd(32)} ${item.message}`
    )
  }
}

async function main() {
  const checks = []
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['scripts/mcp/utekos-insight-server.mjs'],
    cwd: process.cwd()
  })

  const client = new Client({
    name: 'utekos-insight-doctor',
    version: '1.0.0'
  })

  try {
    await client.connect(transport)
    check(checks, 'connect', true, 'stdio server connected')

    const listed = await client.listTools()
    const tools = listed.tools ?? []
    check(
      checks,
      'tool_count',
      tools.length === expectedTools.length,
      `${tools.length} tools`
    )

    for (const toolName of expectedTools) {
      const tool = tools.find(item => item.name === toolName)
      check(
        checks,
        `tool:${toolName}`,
        Boolean(tool),
        tool ? 'available' : 'missing'
      )
      if (!tool) continue

      check(
        checks,
        `schema:${toolName}`,
        Boolean(tool.outputSchema),
        tool.outputSchema ?
          'outputSchema present'
        : 'missing outputSchema'
      )
      check(
        checks,
        `read_only:${toolName}`,
        tool.annotations?.readOnlyHint === true,
        String(tool.annotations?.readOnlyHint)
      )
      check(
        checks,
        `destructive:${toolName}`,
        tool.annotations?.destructiveHint === false,
        String(tool.annotations?.destructiveHint)
      )
      check(
        checks,
        `open_world:${toolName}`,
        tool.annotations?.openWorldHint === false,
        String(tool.annotations?.openWorldHint)
      )
    }

    const bootstrap = await client.callTool({
      name: 'insight_bootstrap',
      arguments: {}
    })
    check(
      checks,
      'call:insight_bootstrap',
      bootstrap.structuredContent?.ok === true,
      bootstrap.structuredContent?.ok === true ?
        'ok'
      : 'bad structuredContent'
    )

    const context = await client.callTool({
      name: 'read_context_bundle',
      arguments: {
        files: [
          'AGENTS.md',
          '.codex/docs/main-documentation/README.md'
        ],
        max_bytes_per_file: 3000
      }
    })
    const files = context.structuredContent?.data?.files ?? []
    check(
      checks,
      'call:read_context_bundle',
      files.length === 2,
      `${files.length} files`
    )

    const surfaceAudit = await client.callTool({
      name: 'connector_surface_audit',
      arguments: {}
    })
    check(
      checks,
      'call:connector_surface_audit',
      surfaceAudit.structuredContent?.ok === true &&
        surfaceAudit.structuredContent?.data?.metadata_policy
          ?.canonical_tools_compliant === true,
      surfaceAudit.structuredContent?.ok === true ?
        'canonical surface policy ok'
      : 'bad structuredContent'
    )

    const denied = await client.callTool({
      name: 'read_project_files',
      arguments: {
        paths: ['.env.local'],
        max_bytes_per_file: 1000
      }
    })
    check(
      checks,
      'policy:secret_denied',
      denied.structuredContent?.ok === false,
      denied.structuredContent?.ok === false ?
        'denied'
      : 'not denied'
    )

    printChecks(checks)
  } finally {
    await client.close()
  }

  const failed = checks.filter(item => !item.ok)
  if (failed.length > 0) {
    console.error(
      `mcp:insight:doctor failed with ${failed.length} failure(s)`
    )
    process.exit(1)
  }

  console.log('mcp:insight:doctor OK')
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exit(1)
})
