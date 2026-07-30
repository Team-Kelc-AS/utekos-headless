#!/usr/bin/env node

import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const port = Number(
  process.env.UTEKOS_CSS_INSIGHT_DOCTOR_PORT ??
    String(19000 + Math.floor(Math.random() * 1000))
)
const endpoint = `http://127.0.0.1:${port}/mcp`
const expectedTools = [
  'css_insight_bootstrap',
  'css_source_inventory',
  'read_css_sources',
  'search_css_sources',
  'css_dependency_graph',
  'css_token_index',
  'css_usage_context',
  'css_audit_report',
  'render_color_palette',
  'render_color_card'
]
const expectedResources = [
  'utekos-css://inventory',
  'utekos-css://graph',
  'utekos-css://tokens',
  'ui://utekos-css/color-audit.html',
  'ui://utekos-css/color-palette.html',
  'ui://utekos-css/color-card.html'
]
const expectedPrompt = 'css_change_context'

function check(checks, name, ok, message) {
  checks.push({ name, ok, message })
}

function printChecks(checks) {
  for (const item of checks) {
    console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name.padEnd(42)} ${item.message}`)
  }
}

async function waitForReady() {
  const deadline = Date.now() + 15000
  let lastError = ''

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/readyz`)
      if (response.ok) return await response.json()
      lastError = `${response.status} ${await response.text()}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await sleep(250)
  }

  throw new Error(`CSS insight MCP server did not become ready: ${lastError}`)
}

async function withTimeout(promise, label, timeoutMs = 10000) {
  const timeout = sleep(timeoutMs).then(() => {
    throw new Error(`${label} timed out after ${timeoutMs}ms`)
  })
  return Promise.race([promise, timeout])
}

async function main() {
  const checks = []
  const child = spawn(process.execPath, ['scripts/mcp/utekos-css-insight-server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      UTEKOS_REPO_ROOT: process.cwd()
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let stdout = ''
  let stderr = ''
  child.stdout.on('data', chunk => {
    stdout += chunk.toString()
  })
  child.stderr.on('data', chunk => {
    stderr += chunk.toString()
  })

  try {
    const ready = await withTimeout(waitForReady(), 'waitForReady', 20000)
    check(checks, 'http:readyz', ready.ok === true, `${ready.css_file_count ?? 0} CSS files`)

    const transport = new StreamableHTTPClientTransport(new URL(endpoint))
    const client = new Client(
      { name: 'utekos-css-insight-doctor', version: '1.0.0' },
      { capabilities: {} }
    )

    try {
      await withTimeout(client.connect(transport), 'client.connect')
      check(checks, 'connect', true, endpoint)

      const listedTools = await withTimeout(client.listTools(), 'client.listTools')
      const tools = listedTools.tools ?? []
      check(checks, 'tool_count', tools.length === expectedTools.length, `${tools.length} tools`)

      for (const toolName of expectedTools) {
        const tool = tools.find(item => item.name === toolName)
        check(checks, `tool:${toolName}`, Boolean(tool), tool ? 'available' : 'missing')
        if (!tool) continue
        check(checks, `schema:${toolName}`, Boolean(tool.outputSchema), tool.outputSchema ? 'outputSchema present' : 'missing outputSchema')
        check(checks, `description:${toolName}`, tool.description?.startsWith('Use this when') === true, tool.description ?? 'missing description')
        check(checks, `read_only:${toolName}`, tool.annotations?.readOnlyHint === true, String(tool.annotations?.readOnlyHint))
        check(checks, `destructive:${toolName}`, tool.annotations?.destructiveHint === false, String(tool.annotations?.destructiveHint))
        check(checks, `open_world:${toolName}`, tool.annotations?.openWorldHint === false, String(tool.annotations?.openWorldHint))
      }
      const tokenTool = tools.find(item => item.name === 'css_token_index')
      check(
        checks,
        'apps_meta:css_token_index',
        tokenTool?._meta?.['openai/outputTemplate'] === 'ui://utekos-css/color-audit.html',
        String(tokenTool?._meta?.['openai/outputTemplate'] ?? 'missing')
      )
      const paletteTool = tools.find(item => item.name === 'render_color_palette')
      check(
        checks,
        'apps_meta:render_color_palette',
        paletteTool?._meta?.ui?.resourceUri === 'ui://utekos-css/color-palette.html' &&
          paletteTool?._meta?.['openai/outputTemplate'] === 'ui://utekos-css/color-palette.html',
        String(paletteTool?._meta?.ui?.resourceUri ?? paletteTool?._meta?.['openai/outputTemplate'] ?? 'missing')
      )
      const cardTool = tools.find(item => item.name === 'render_color_card')
      check(
        checks,
        'apps_meta:render_color_card',
        cardTool?._meta?.ui?.resourceUri === 'ui://utekos-css/color-card.html' &&
          cardTool?._meta?.['openai/outputTemplate'] === 'ui://utekos-css/color-card.html',
        String(cardTool?._meta?.ui?.resourceUri ?? cardTool?._meta?.['openai/outputTemplate'] ?? 'missing')
      )

      const listedResources = await withTimeout(client.listResources(), 'client.listResources')
      const resources = listedResources.resources ?? []
      const resourceUris = new Set(resources.map(item => item.uri))
      for (const uri of expectedResources) {
        check(checks, `resource:${uri}`, resourceUris.has(uri), resourceUris.has(uri) ? 'available' : 'missing')
      }
      check(checks, 'resource:file_template_listed', resources.some(item => item.uri === 'utekos-css://file/src%2Fglobals.css'), 'src/globals.css file resource')

      const listedPrompts = await withTimeout(client.listPrompts(), 'client.listPrompts')
      const prompts = listedPrompts.prompts ?? []
      check(checks, `prompt:${expectedPrompt}`, prompts.some(item => item.name === expectedPrompt), prompts.map(item => item.name).join(', '))

      const bootstrap = await withTimeout(
        client.callTool({ name: 'css_insight_bootstrap', arguments: {} }),
        'call css_insight_bootstrap'
      )
      check(
        checks,
        'call:css_insight_bootstrap',
        bootstrap.structuredContent?.ok === true &&
          bootstrap.structuredContent?.data?.server?.public_no_auth === true &&
          bootstrap.structuredContent?.data?.css_scope?.default === 'runtime-used-colors',
        bootstrap.structuredContent?.data?.css_scope?.default ?? 'bad structuredContent'
      )

      const inventory = await withTimeout(
        client.callTool({ name: 'css_source_inventory', arguments: {} }),
        'call css_source_inventory'
      )
      const inventoryFiles = inventory.structuredContent?.data?.files ?? []
      const inventoryPaths = new Set(inventoryFiles.map(file => file.path))
      check(checks, 'inventory:globals_css', inventoryPaths.has('src/globals.css'), inventoryPaths.has('src/globals.css') ? 'present' : 'missing')
      check(checks, 'inventory:no_agent_css', ![...inventoryPaths].some(file => file.startsWith('.agents/css/')), 'agent CSS excluded')
      check(checks, 'inventory:no_shadcn_default_css', !inventoryPaths.has('src/components/shadcn-default.css'), 'shadcn default excluded')
      check(checks, 'inventory:semantic_light', inventoryPaths.has('src/tokens/semantic.light.css'), inventoryPaths.has('src/tokens/semantic.light.css') ? 'present' : 'missing')
      check(checks, 'inventory:css_module', inventoryPaths.has('src/app/inspirasjon/components/cards/CardGridCols3.module.css'), inventoryPaths.has('src/app/inspirasjon/components/cards/CardGridCols3.module.css') ? 'present' : 'missing')
      check(checks, 'inventory:gcloud_excluded', ![...inventoryPaths].some(file => file.startsWith('gcloud components install')), 'gcloud cache excluded')

      const graph = await withTimeout(
        client.callTool({ name: 'css_dependency_graph', arguments: {} }),
        'call css_dependency_graph'
      )
      check(
        checks,
        'call:css_dependency_graph',
        graph.structuredContent?.data?.root === 'src/globals.css' &&
          Array.isArray(graph.structuredContent?.data?.non_runtime_css),
        graph.structuredContent?.data?.root ?? 'bad graph'
      )
      check(
        checks,
        'graph:no_reachable_orphans',
        (graph.structuredContent?.data?.reachable_from_root ?? []).every(
          filePath => !(graph.structuredContent?.data?.orphan_css ?? []).includes(filePath)
        ),
        `${graph.structuredContent?.data?.orphan_css?.length ?? 0} orphan CSS files`
      )

      const tokens = await withTimeout(
        client.callTool({ name: 'css_token_index', arguments: {} }),
        'call css_token_index'
      )
      check(
        checks,
        'call:css_token_index',
        Number(tokens.structuredContent?.data?.summary?.definition_count ?? 0) > 0 &&
          Number(tokens.structuredContent?.data?.summary?.definition_count ?? 0) <
            Number(tokens.structuredContent?.data?.summary?.candidate_definition_count ?? 0),
        `${tokens.structuredContent?.data?.summary?.definition_count ?? 0}/${tokens.structuredContent?.data?.summary?.candidate_definition_count ?? 0} used/candidate definitions`
      )
      const semanticTokenNames = new Set((tokens.structuredContent?.data?.semantic_tokens ?? []).map(item => item.name))
      for (const tokenName of ['--primary', '--background', '--card', '--border', '--ring']) {
        check(checks, `token:semantic:${tokenName}`, semanticTokenNames.has(tokenName), semanticTokenNames.has(tokenName) ? 'present' : 'missing')
      }
      check(
        checks,
        'token:no_agent_sources',
        !(tokens.structuredContent?.data?.definitions ?? []).some(item => String(item.path ?? '').startsWith('.agents/css/')),
        'agent sources excluded'
      )
      check(
        checks,
        'token:excluded_candidates_summary',
        Number(tokens.structuredContent?.data?.excluded_candidates_summary?.reference_definition_count ?? 0) > 0,
        `${tokens.structuredContent?.data?.excluded_candidates_summary?.reference_definition_count ?? 0} reference definitions excluded`
      )

      const sampleColor = {
        name: 'flame-orange',
        value: 'oklch(0.67 0.2 45)',
        oklch: 'oklch(0.67 0.2 45)',
        hex: '#d7672a',
        rgb: 'rgb(215 103 42)',
        hsl: 'hsl(21 69% 50%)',
        category: 'brand',
        usage_in_tokens: ['--primary', '--checkout-button']
      }
      const palette = await withTimeout(
        client.callTool({
          name: 'render_color_palette',
          arguments: {
            palette_name: 'Utekos doctor palette',
            description: 'Doctor smoke palette',
            colors: [sampleColor],
            focused_color: sampleColor
          }
        }),
        'call render_color_palette'
      )
      check(
        checks,
        'call:render_color_palette',
        palette.structuredContent?.palette_name === 'Utekos doctor palette' &&
          palette.structuredContent?.color_count === 1 &&
          palette.structuredContent?.focused_color?.rgb === sampleColor.rgb,
        `${palette.structuredContent?.color_count ?? 0} colors`
      )

      const colorCard = await withTimeout(
        client.callTool({
          name: 'render_color_card',
          arguments: {
            ...sampleColor,
            description: 'Warm Utekos brand accent'
          }
        }),
        'call render_color_card'
      )
      check(
        checks,
        'call:render_color_card',
        colorCard.structuredContent?.name === sampleColor.name &&
          colorCard.structuredContent?.rgb === sampleColor.rgb &&
          colorCard.structuredContent?.usage_in_tokens?.includes('--primary') === true,
        colorCard.structuredContent?.name ?? 'bad structuredContent'
      )

      const usage = await withTimeout(
        client.callTool({ name: 'css_usage_context', arguments: {} }),
        'call css_usage_context'
      )
      check(
        checks,
        'call:css_usage_context',
        Array.isArray(usage.structuredContent?.data?.imports),
        `${usage.structuredContent?.data?.imports?.length ?? 0} imports`
      )

      const search = await withTimeout(
        client.callTool({ name: 'search_css_sources', arguments: { query: '@import', limit: 20 } }),
        'call search_css_sources'
      )
      check(
        checks,
        'call:search_css_sources',
        search.structuredContent?.ok === true && search.structuredContent?.data?.matches?.length > 0,
        `${search.structuredContent?.data?.matches?.length ?? 0} matches`
      )

      const read = await withTimeout(
        client.callTool({
          name: 'read_css_sources',
          arguments: { paths: ['src/globals.css', 'src/tokens/semantic.light.css'], max_bytes_per_file: 10000 }
        }),
        'call read_css_sources'
      )
      check(
        checks,
        'call:read_css_sources',
        read.structuredContent?.data?.files?.length === 2,
        `${read.structuredContent?.data?.files?.length ?? 0} files`
      )

      const denied = await withTimeout(
        client.callTool({
          name: 'read_css_sources',
          arguments: {
            paths: [
              '.agents/css/brand-colors.css',
              '.env.local',
              'package.json',
              'mcp.json'
            ],
            max_bytes_per_file: 1000
          }
        }),
        'call read_css_sources denied policy'
      )
      check(
        checks,
        'policy:denied_paths',
        denied.structuredContent?.ok === false && denied.structuredContent?.data?.denied_files?.length === 4,
        `${denied.structuredContent?.data?.denied_files?.length ?? 0} denied`
      )

      const audit = await withTimeout(
        client.callTool({ name: 'css_audit_report', arguments: {} }),
        'call css_audit_report'
      )
      check(
        checks,
        'call:css_audit_report',
        typeof audit.structuredContent?.data?.warning_count === 'number',
        `${audit.structuredContent?.data?.warning_count ?? 'unknown'} findings`
      )

      const inventoryResource = await withTimeout(
        client.readResource({ uri: 'utekos-css://inventory' }),
        'read inventory resource'
      )
      check(checks, 'read_resource:inventory', Boolean(inventoryResource.contents?.[0]?.text), 'resource returned text')

      const widgetResource = await withTimeout(
        client.readResource({ uri: 'ui://utekos-css/color-audit.html' }),
        'read color audit widget resource'
      )
      check(
        checks,
        'read_resource:color_widget',
        widgetResource.contents?.[0]?.mimeType === 'text/html;profile=mcp-app' &&
          widgetResource.contents?.[0]?._meta?.['openai/widgetCSP']?.connect_domains?.length === 0,
        widgetResource.contents?.[0]?.mimeType ?? 'missing'
      )

      const paletteWidgetResource = await withTimeout(
        client.readResource({ uri: 'ui://utekos-css/color-palette.html' }),
        'read color palette widget resource'
      )
      check(
        checks,
        'read_resource:color_palette_widget',
        paletteWidgetResource.contents?.[0]?.mimeType === 'text/html;profile=mcp-app' &&
          paletteWidgetResource.contents?.[0]?._meta?.ui?.csp?.connectDomains?.length === 0 &&
          paletteWidgetResource.contents?.[0]?.text?.includes('ui/notifications/tool-result') === true,
        paletteWidgetResource.contents?.[0]?.mimeType ?? 'missing'
      )

      const cardWidgetResource = await withTimeout(
        client.readResource({ uri: 'ui://utekos-css/color-card.html' }),
        'read color card widget resource'
      )
      check(
        checks,
        'read_resource:color_card_widget',
        cardWidgetResource.contents?.[0]?.mimeType === 'text/html;profile=mcp-app' &&
          cardWidgetResource.contents?.[0]?._meta?.ui?.csp?.connectDomains?.length === 0 &&
          cardWidgetResource.contents?.[0]?.text?.includes('ui/notifications/tool-result') === true,
        cardWidgetResource.contents?.[0]?.mimeType ?? 'missing'
      )

      const fileResource = await withTimeout(
        client.readResource({ uri: 'utekos-css://file/src%2Fglobals.css' }),
        'read file resource'
      )
      check(
        checks,
        'read_resource:file',
        fileResource.contents?.[0]?.text?.includes('@import \'tailwindcss\'') === true,
        'src/globals.css content'
      )

      const prompt = await withTimeout(
        client.getPrompt({
          name: expectedPrompt,
          arguments: { task: 'Audit CSS tokens', paths: 'src/globals.css' }
        }),
        'get css_change_context prompt'
      )
      check(checks, 'get_prompt:css_change_context', prompt.messages?.length === 1, `${prompt.messages?.length ?? 0} messages`)
    } finally {
      await client.close()
    }
  } finally {
    child.kill('SIGTERM')
  }

  printChecks(checks)
  const failed = checks.filter(item => !item.ok)
  if (failed.length > 0) {
    console.error(`mcp:css-insight:doctor failed with ${failed.length} failure(s)`)
    if (stdout.trim()) console.error(`server stdout:\n${stdout}`)
    if (stderr.trim()) console.error(`server stderr:\n${stderr}`)
    process.exit(1)
  }

  console.log('mcp:css-insight:doctor OK')
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack : String(error))
  process.exit(1)
})
