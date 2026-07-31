#!/usr/bin/env node

import process from 'node:process'

import {
  Client,
  StdioClientTransport
} from '@modelcontextprotocol/client'

const expectedTools = [
  'browser_bootstrap',
  'browser_open',
  'browser_resize',
  'browser_snapshot',
  'browser_console_messages',
  'browser_network_requests',
  'browser_network_request',
  'browser_take_screenshot',
  'browser_accessibility_audit',
  'browser_performance_audit',
  'browser_devtools_metrics',
  'browser_close'
]

function check(checks, name, ok, message) {
  checks.push({ name, ok, message })
}

function printChecks(checks) {
  for (const item of checks) {
    console.log(
      `${item.ok ? 'PASS' : 'FAIL'} ${item.name.padEnd(36)} ${item.message}`
    )
  }
}

async function main() {
  const checks = []
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['scripts/mcp/utekos-browser-server.mjs'],
    cwd: process.cwd()
  })

  const client = new Client({
    name: 'utekos-browser-doctor',
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
        `destructive:${toolName}`,
        tool.annotations?.destructiveHint === false,
        String(tool.annotations?.destructiveHint)
      )
    }

    const bootstrap = await client.callTool({
      name: 'browser_bootstrap',
      arguments: {}
    })
    check(
      checks,
      'call:browser_bootstrap',
      bootstrap.structuredContent?.ok === true,
      (
        bootstrap.structuredContent?.data?.playwright
          ?.chromium_launch_ok === true
      ) ?
        'chromium ok'
      : 'bootstrap returned warning'
    )

    const open = await client.callTool({
      name: 'browser_open',
      arguments: {
        url: 'data:text/html,<html><title>Utekos MCP Doctor</title><body><h1>Utekos Browser Doctor</h1><button>OK</button></body></html>'
      }
    })
    check(
      checks,
      'call:browser_open',
      open.structuredContent?.ok === true,
      (
        open.structuredContent?.data?.page?.title ===
          'Utekos MCP Doctor'
      ) ?
        'opened data URL'
      : 'unexpected page state'
    )

    const snapshot = await client.callTool({
      name: 'browser_snapshot',
      arguments: {}
    })
    check(
      checks,
      'call:browser_snapshot',
      snapshot.structuredContent?.ok === true,
      (
        snapshot.structuredContent?.data?.aria_snapshot?.includes(
          'Utekos Browser Doctor'
        )
      ) ?
        'snapshot contains heading'
      : 'snapshot missing expected heading'
    )

    const accessibility = await client.callTool({
      name: 'browser_accessibility_audit',
      arguments: {}
    })
    check(
      checks,
      'call:browser_accessibility_audit',
      accessibility.structuredContent?.ok === true,
      `violations=${accessibility.structuredContent?.data?.axe?.violations_count}`
    )

    const performance = await client.callTool({
      name: 'browser_performance_audit',
      arguments: {}
    })
    check(
      checks,
      'call:browser_performance_audit',
      performance.structuredContent?.ok === true,
      `resources=${performance.structuredContent?.data?.resources?.count}`
    )

    const devtools = await client.callTool({
      name: 'browser_devtools_metrics',
      arguments: {}
    })
    check(
      checks,
      'call:browser_devtools_metrics',
      devtools.structuredContent?.ok === true,
      `metrics=${devtools.structuredContent?.data?.performance_metrics?.length}`
    )

    await client.callTool({
      name: 'browser_close',
      arguments: {}
    })
    check(checks, 'call:browser_close', true, 'closed')

    printChecks(checks)
  } finally {
    await client.close()
  }

  const failed = checks.filter(item => !item.ok)
  if (failed.length > 0) {
    console.error(
      `mcp:browser:doctor failed with ${failed.length} failure(s)`
    )
    process.exit(1)
  }

  console.log('mcp:browser:doctor OK')
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exit(1)
})
