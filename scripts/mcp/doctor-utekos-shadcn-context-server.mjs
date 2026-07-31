#!/usr/bin/env node

import process from 'node:process'

import {
  Client,
  StdioClientTransport
} from '@modelcontextprotocol/client'

const expectedTools = [
  'shadcn_context_bootstrap',
  'shadcn_source_inventory',
  'read_shadcn_sources',
  'search_shadcn_sources',
  'shadcn_registry_get_project_registries',
  'shadcn_registry_list_items',
  'shadcn_registry_search_items',
  'shadcn_registry_view_items',
  'shadcn_registry_get_examples',
  'shadcn_registry_get_add_command',
  'shadcn_registry_get_audit_checklist'
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
    args: ['scripts/mcp/utekos-shadcn-context-server.mjs'],
    cwd: process.cwd()
  })

  const client = new Client({
    name: 'utekos-shadcn-context-doctor',
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
      name: 'shadcn_context_bootstrap',
      arguments: {}
    })
    check(
      checks,
      'call:shadcn_context_bootstrap',
      bootstrap.structuredContent?.ok === true &&
        bootstrap.structuredContent?.data?.tailwind_css_file ===
          'src/globals.css',
      bootstrap.structuredContent?.ok === true ?
        'ok'
      : 'bad structuredContent'
    )

    const inventory = await client.callTool({
      name: 'shadcn_source_inventory',
      arguments: {}
    })
    const files = inventory.structuredContent?.data?.files ?? []
    const paths = new Set(files.map(file => file.path))
    check(
      checks,
      'inventory:components_json',
      paths.has('components.json'),
      paths.has('components.json') ? 'present' : 'missing'
    )
    check(
      checks,
      'inventory:globals_css',
      paths.has('src/globals.css'),
      paths.has('src/globals.css') ? 'present' : 'missing'
    )
    check(
      checks,
      'inventory:academy',
      [...paths].some(file =>
        file.startsWith('scripts/shadcn/academy/')
      ),
      `${inventory.structuredContent?.data?.academy_files?.length ?? 0} academy files`
    )
    check(
      checks,
      'inventory:ui',
      [...paths].some(file =>
        file.startsWith('src/components/ui/')
      ),
      `${inventory.structuredContent?.data?.ui_component_files?.length ?? 0} ui files`
    )
    check(
      checks,
      'inventory:utekos_cards',
      paths.has('src/components/cards/utekos-card.tsx') &&
        paths.has(
          'src/app/inspirasjon/cardproduction/cards/CardShowCase.tsx'
        ),
      (
        paths.has('src/components/cards/utekos-card.tsx') &&
          paths.has(
            'src/app/inspirasjon/cardproduction/cards/CardShowCase.tsx'
          )
      ) ?
        'card system present'
      : 'card system missing'
    )

    const read = await client.callTool({
      name: 'read_shadcn_sources',
      arguments: {
        paths: [
          'components.json',
          'src/globals.css',
          'scripts/shadcn/academy/css-variables.md',
          'src/components/ui/button.tsx',
          'src/components/cards/utekos-card.tsx',
          'src/app/inspirasjon/cardproduction/cards/CardShowCase.tsx'
        ],
        max_bytes_per_file: 5000
      }
    })
    check(
      checks,
      'call:read_shadcn_sources',
      read.structuredContent?.data?.files?.length === 6,
      `${read.structuredContent?.data?.files?.length ?? 0} files`
    )

    const denied = await client.callTool({
      name: 'read_shadcn_sources',
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

    const search = await client.callTool({
      name: 'search_shadcn_sources',
      arguments: { query: 'components.json', limit: 10 }
    })
    check(
      checks,
      'call:search_shadcn_sources',
      search.structuredContent?.ok === true,
      search.structuredContent?.ok === true ?
        'ok'
      : 'bad structuredContent'
    )

    const registries = await client.callTool({
      name: 'shadcn_registry_get_project_registries',
      arguments: {}
    })
    const registryText =
      registries.structuredContent?.data?.content?.[0]?.text ??
      ''
    check(
      checks,
      'call:shadcn_registry_get_project_registries',
      registries.structuredContent?.ok === true &&
        registryText.includes('@shadcn'),
      registries.structuredContent?.ok === true ?
        'ok'
      : 'bad structuredContent'
    )

    const addCommand = await client.callTool({
      name: 'shadcn_registry_get_add_command',
      arguments: { items: ['@shadcn/button'] }
    })
    check(
      checks,
      'call:shadcn_registry_get_add_command',
      addCommand.structuredContent?.ok === true,
      addCommand.structuredContent?.ok === true ?
        'ok'
      : 'bad structuredContent'
    )

    printChecks(checks)
  } finally {
    await client.close()
  }

  const failed = checks.filter(item => !item.ok)
  if (failed.length > 0) {
    console.error(
      `mcp:shadcn-context:doctor failed with ${failed.length} failure(s)`
    )
    process.exit(1)
  }

  console.log('mcp:shadcn-context:doctor OK')
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exit(1)
})
