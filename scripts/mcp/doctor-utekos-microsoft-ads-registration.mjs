#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import {
  MICROSOFT_ADS_OFFICIAL_OAUTH_MCP_URL,
  MICROSOFT_ADS_OFFICIAL_SERVER_ID,
  UTEKOS_MICROSOFT_ADS_SERVER_ID,
  UTEKOS_MICROSOFT_ADS_TOOLS,
  UTEKOS_MICROSOFT_ADS_TUNNEL_PROFILE_ID,
  UTEKOS_MICROSOFT_ADS_TUNNEL_TARGET,
  createMicrosoftAdsPackageScripts,
  createMicrosoftAdsServerConfig,
  createOfficialMicrosoftAdsServerConfig
} from './register-utekos-microsoft-ads.mjs'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(moduleDir, '../..')

const CODEX_BEGIN = '# BEGIN UTEKOS MICROSOFT ADS MCP'
const CODEX_END = '# END UTEKOS MICROSOFT ADS MCP'

export function inspectMicrosoftAdsRegistration({ root = repoRoot } = {}) {
  const checks = []
  const add = (name, ok, message) => {
    checks.push({ name, ok, message })
  }

  const base = readJsonSafe(
    path.join(root, 'config/mcp/servers.base.json'),
    add,
    'base-config'
  )
  if (base) {
    const actual = base.mcpServers?.[UTEKOS_MICROSOFT_ADS_SERVER_ID]
    const expected = createMicrosoftAdsServerConfig()
    add(
      'base-server',
      deepEqual(actual, expected),
      actual
        ? 'canonical Microsoft Ads stdio entry is present'
        : 'missing canonical Microsoft Ads stdio entry'
    )
    const officialActual =
      base.mcpServers?.[MICROSOFT_ADS_OFFICIAL_SERVER_ID]
    add(
      'official-base-server',
      deepEqual(officialActual, createOfficialMicrosoftAdsServerConfig()),
      officialActual
        ? 'official Microsoft Ads remote MCP entry is present'
        : 'missing official Microsoft Ads remote MCP entry'
    )
  }

  const cursorRuntime = readJsonSafe(
    path.join(root, 'config/mcp/cursor-runtime.json'),
    add,
    'cursor-runtime-config'
  )
  if (cursorRuntime) {
    add(
      'cursor-local-allowlist',
      typeof cursorRuntime.includedLocalServers?.[
        UTEKOS_MICROSOFT_ADS_SERVER_ID
      ] === 'string',
      'Microsoft Ads must be explicitly present in includedLocalServers'
    )
  }

  const packageJson = readJsonSafe(
    path.join(root, 'package.json'),
    add,
    'package-config'
  )
  if (packageJson) {
    const expectedScripts = createMicrosoftAdsPackageScripts()
    const mismatches = Object.entries(expectedScripts)
      .filter(([name, value]) => packageJson.scripts?.[name] !== value)
      .map(([name]) => name)
    add(
      'package-scripts',
      mismatches.length === 0,
      mismatches.length === 0
        ? 'all Microsoft Ads MCP/tunnel scripts are registered'
        : `missing or mismatched: ${mismatches.join(', ')}`
    )
  }

  const chatgptConfig = readJsonSafe(
    path.join(root, 'config/mcp/chatgpt-profiles.json'),
    add,
    'chatgpt-profile-config'
  )
  if (chatgptConfig) {
    const profile = (chatgptConfig.directTunnelProfiles ?? []).find(
      item =>
        item?.id === UTEKOS_MICROSOFT_ADS_TUNNEL_PROFILE_ID ||
        item?.tunnelTarget === UTEKOS_MICROSOFT_ADS_TUNNEL_TARGET
    )
    add(
      'chatgpt-direct-tunnel-profile',
      Boolean(profile),
      profile
        ? `${profile.tunnelProfile} @ ${profile.healthAddr}/${profile.mcpPort}`
        : 'missing Microsoft Ads direct tunnel profile'
    )
    if (profile) {
      const toolSet = new Set(profile.canonicalTools ?? [])
      const missingTools = UTEKOS_MICROSOFT_ADS_TOOLS.filter(
        tool => !toolSet.has(tool)
      )
      add(
        'chatgpt-tool-surface',
        missingTools.length === 0,
        missingTools.length === 0
          ? 'all seven read-only Microsoft Ads tools are registered'
          : `missing tools: ${missingTools.join(', ')}`
      )
    }
  }

  const codexPath = path.join(root, '.codex/config.toml')
  if (!fs.existsSync(codexPath)) {
    add('codex-project-config', false, '.codex/config.toml is missing')
  } else {
    const codex = fs.readFileSync(codexPath, 'utf8')
    const hasMarkers = codex.includes(CODEX_BEGIN) && codex.includes(CODEX_END)
    const hasTable = codex.includes(
      `[mcp_servers.${UTEKOS_MICROSOFT_ADS_SERVER_ID}]`
    )
    const hasOfficialTable = codex.includes(
      `[mcp_servers.${MICROSOFT_ADS_OFFICIAL_SERVER_ID}]`
    )
    const hasOfficialUrl = codex.includes(
      `url = ${JSON.stringify(MICROSOFT_ADS_OFFICIAL_OAUTH_MCP_URL)}`
    )
    const missingTools = UTEKOS_MICROSOFT_ADS_TOOLS.filter(
      tool => !codex.includes(`"${tool}"`)
    )
    add(
      'codex-project-config',
      hasMarkers &&
        hasTable &&
        hasOfficialTable &&
        hasOfficialUrl &&
        missingTools.length === 0,
      hasMarkers &&
        hasTable &&
        hasOfficialTable &&
        hasOfficialUrl &&
        missingTools.length === 0
        ? 'project-scoped Codex MCP tables are registered'
        : 'Codex managed block is incomplete'
    )
  }

  inspectGeneratedJson(
    root,
    'mcp.json',
    'generated-full-catalog',
    checks,
    UTEKOS_MICROSOFT_ADS_SERVER_ID
  )
  inspectGeneratedJson(
    root,
    'mcp.json',
    'generated-official-full-catalog',
    checks,
    MICROSOFT_ADS_OFFICIAL_SERVER_ID
  )
  inspectGeneratedJson(
    root,
    '.cursor/mcp.remote.json',
    'generated-cursor-runtime',
    checks,
    UTEKOS_MICROSOFT_ADS_SERVER_ID
  )
  inspectGeneratedJson(
    root,
    '.cursor/mcp.remote.json',
    'generated-official-cursor-runtime',
    checks,
    MICROSOFT_ADS_OFFICIAL_SERVER_ID
  )

  const cursorLink = path.join(root, '.cursor/mcp.json')
  if (!fs.existsSync(cursorLink)) {
    add('cursor-runtime-link', false, '.cursor/mcp.json is missing')
  } else {
    const stats = fs.lstatSync(cursorLink)
    add(
      'cursor-runtime-link',
      stats.isSymbolicLink() || stats.isFile(),
      stats.isSymbolicLink()
        ? `.cursor/mcp.json -> ${fs.readlinkSync(cursorLink)}`
        : '.cursor/mcp.json exists as a regular file'
    )
  }

  add(
    'tunnel-wrapper',
    fs.existsSync(
      path.join(root, 'scripts/mcp/openai-tunnel-microsoft-ads.mjs')
    ),
    'Microsoft Ads delegates to the canonical OpenAI tunnel runner'
  )

  return checks
}

function inspectGeneratedJson(root, relativePath, name, checks, serverId) {
  const filePath = path.join(root, relativePath)
  if (!fs.existsSync(filePath)) {
    checks.push({
      name,
      ok: false,
      message: `${relativePath} is missing; run pnpm mcp:build`
    })
    return
  }

  try {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    checks.push({
      name,
      ok: Boolean(json.mcpServers?.[serverId]),
      message: Boolean(json.mcpServers?.[serverId])
        ? `${serverId} is present`
        : `${serverId} is missing`
    })
  } catch (error) {
    checks.push({
      name,
      ok: false,
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function readJsonSafe(filePath, add, name) {
  if (!fs.existsSync(filePath)) {
    add(name, false, `${path.relative(repoRoot, filePath)} is missing`)
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    add(name, false, error instanceof Error ? error.message : String(error))
    return null
  }
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function runOptional(root, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000
  })
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error
  }
}

function printChecks(checks) {
  for (const item of checks) {
    console.log(`${item.ok ? 'OK' : 'ERROR'} ${item.name}: ${item.message}`)
  }
}

function parseArgs(argv) {
  return {
    staticOnly: argv.includes('--static'),
    tunnel: argv.includes('--tunnel'),
    codex: argv.includes('--codex'),
    json: argv.includes('--json')
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const checks = inspectMicrosoftAdsRegistration({ root: repoRoot })

  if (!args.staticOnly) {
    const runtime = runOptional(repoRoot, 'node', [
      'scripts/mcp/doctor-utekos-microsoft-ads-server.mjs'
    ])
    checks.push({
      name: 'mcp-runtime-doctor',
      ok: runtime.ok,
      message: runtime.ok
        ? firstUsefulLine(runtime.stdout) || 'tool discovery passed'
        : firstUsefulLine(runtime.stderr) || firstUsefulLine(runtime.stdout) || 'runtime doctor failed'
    })
  }

  if (args.tunnel) {
    const tunnel = runOptional(repoRoot, 'node', [
      'scripts/mcp/openai-tunnel-microsoft-ads.mjs',
      'doctor'
    ])
    checks.push({
      name: 'secure-tunnel-doctor',
      ok: tunnel.ok,
      message: tunnel.ok
        ? firstUsefulLine(tunnel.stdout) || 'tunnel doctor passed'
        : firstUsefulLine(tunnel.stderr) || firstUsefulLine(tunnel.stdout) || 'tunnel doctor failed'
    })
  }

  if (args.codex) {
    const codex = runOptional(repoRoot, 'codex', ['mcp', 'list'])
    const combined = `${codex.stdout}\n${codex.stderr}`
    const hasLocal = combined.includes(UTEKOS_MICROSOFT_ADS_SERVER_ID)
    const hasOfficial = combined.includes(MICROSOFT_ADS_OFFICIAL_SERVER_ID)
    checks.push({
      name: 'codex-mcp-list',
      ok: codex.ok && hasLocal && hasOfficial,
      message: codex.ok
        ? hasLocal && hasOfficial
          ? 'Codex reports both Microsoft Ads MCP servers'
          : 'Codex ran, but one or both Microsoft Ads servers were not listed; ensure the project is trusted and restart Codex'
        : codex.error?.message || firstUsefulLine(codex.stderr) || 'codex mcp list failed'
    })
  }

  if (args.json) {
    console.log(JSON.stringify({ checks }, null, 2))
  } else {
    printChecks(checks)
  }

  if (checks.some(item => !item.ok)) process.exit(1)
}

function firstUsefulLine(value) {
  return String(value ?? '')
    .split('\n')
    .map(line => line.trim())
    .find(Boolean) ?? ''
}

const argvPath = process.argv[1]
if (argvPath && path.resolve(argvPath) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
