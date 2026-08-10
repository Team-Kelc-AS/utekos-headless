#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const UTEKOS_MICROSOFT_ADS_SERVER_ID = 'utekos-microsoft-ads'
export const MICROSOFT_ADS_OFFICIAL_SERVER_ID = 'microsoft-ads-official'
export const MICROSOFT_ADS_OFFICIAL_MCP_URL =
  'https://partner.api.bingads.microsoft.com/ext/mcp/vnext?toolSetNames=OpenBeta'
export const MICROSOFT_ADS_OFFICIAL_OAUTH_MCP_URL =
  'https://partner.api.bingads.microsoft.com/ext/mcp/vnext'
export const UTEKOS_MICROSOFT_ADS_TUNNEL_PROFILE_ID =
  'utekos_chatgpt_microsoft_ads'
export const UTEKOS_MICROSOFT_ADS_TUNNEL_TARGET = 'microsoft-ads'

export const UTEKOS_MICROSOFT_ADS_TOOLS = Object.freeze([
  'microsoft_ads_account_snapshot',
  'microsoft_ads_account_health',
  'microsoft_ads_tracking_health',
  'microsoft_ads_merchant_health',
  'microsoft_ads_diagnose',
  'microsoft_ads_recommendations',
  'microsoft_ads_report'
])

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_REPO_ROOT = path.resolve(moduleDir, '../..')

const CODEX_BEGIN = '# BEGIN UTEKOS MICROSOFT ADS MCP'
const CODEX_END = '# END UTEKOS MICROSOFT ADS MCP'

const DEFAULT_CURSOR_REASON =
  'Read-only Microsoft Advertising operator MCP. Uses the existing repo-local Microsoft Ads configuration and is explicitly allowlisted for Cursor runtime startup.'

const REQUIRED_PATHS = Object.freeze([
  'package.json',
  'config/mcp/servers.base.json',
  'config/mcp/cursor-runtime.json',
  'config/mcp/chatgpt-profiles.json',
  'scripts/mcp/build-config.ts',
  'scripts/mcp/openai-tunnel.mjs',
  'scripts/mcp/utekos-microsoft-ads-server.mjs',
  'scripts/mcp/doctor-utekos-microsoft-ads-server.mjs',
  'scripts/mcp/openai-tunnel-microsoft-ads.mjs',
  'scripts/mcp/doctor-utekos-microsoft-ads-registration.mjs'
])

export function createMicrosoftAdsServerConfig() {
  return {
    type: 'stdio',
    command: 'node',
    args: ['scripts/mcp/utekos-microsoft-ads-server.mjs'],
    tools: [...UTEKOS_MICROSOFT_ADS_TOOLS],
    autoApprove: []
  }
}

export function createOfficialMicrosoftAdsServerConfig() {
  return {
    type: 'http',
    url: MICROSOFT_ADS_OFFICIAL_MCP_URL,
    autoApprove: []
  }
}

export function createMicrosoftAdsPackageScripts() {
  return {
    'mcp:microsoft-ads:register':
      'node scripts/mcp/register-utekos-microsoft-ads.mjs',
    'mcp:microsoft-ads:serve':
      'node scripts/mcp/utekos-microsoft-ads-server.mjs',
    'mcp:microsoft-ads:doctor':
      'node scripts/mcp/doctor-utekos-microsoft-ads-server.mjs',
    'mcp:microsoft-ads:doctor:live':
      'node scripts/mcp/doctor-utekos-microsoft-ads-server.mjs --live',
    'mcp:microsoft-ads:registration:doctor':
      'node scripts/mcp/doctor-utekos-microsoft-ads-registration.mjs',
    'mcp:tunnel:init:microsoft-ads':
      'node scripts/mcp/openai-tunnel-microsoft-ads.mjs init',
    'mcp:tunnel:check:microsoft-ads':
      'node scripts/mcp/openai-tunnel-microsoft-ads.mjs check',
    'mcp:tunnel:doctor:microsoft-ads':
      'node scripts/mcp/openai-tunnel-microsoft-ads.mjs doctor',
    'mcp:tunnel:run:microsoft-ads':
      'node scripts/mcp/openai-tunnel-microsoft-ads.mjs run',
    'mcp:tunnel:start:microsoft-ads':
      'node scripts/mcp/openai-tunnel-microsoft-ads.mjs start',
    'mcp:tunnel:status:microsoft-ads':
      'node scripts/mcp/openai-tunnel-microsoft-ads.mjs status',
    'mcp:tunnel:stop:microsoft-ads':
      'node scripts/mcp/openai-tunnel-microsoft-ads.mjs stop'
  }
}

export function applyMicrosoftAdsRegistration({
  repoRoot = DEFAULT_REPO_ROOT,
  runBuild = true,
  runner = spawnSync
} = {}) {
  const root = path.resolve(repoRoot)
  assertRepoShape(root)

  const changed = []
  const serverConfig = createMicrosoftAdsServerConfig()

  const basePath = path.join(root, 'config/mcp/servers.base.json')
  const base = readJson(basePath)
  base.mcpServers ??= {}
  if (!isDeepEqual(base.mcpServers[UTEKOS_MICROSOFT_ADS_SERVER_ID], serverConfig)) {
    base.mcpServers[UTEKOS_MICROSOFT_ADS_SERVER_ID] = serverConfig
    writeJsonAtomic(basePath, base)
    changed.push(relative(root, basePath))
  }

  const officialServerConfig = createOfficialMicrosoftAdsServerConfig()
  if (
    !isDeepEqual(
      base.mcpServers[MICROSOFT_ADS_OFFICIAL_SERVER_ID],
      officialServerConfig
    )
  ) {
    base.mcpServers[MICROSOFT_ADS_OFFICIAL_SERVER_ID] = officialServerConfig
    writeJsonAtomic(basePath, base)
    if (!changed.includes(relative(root, basePath))) {
      changed.push(relative(root, basePath))
    }
  }

  const cursorPath = path.join(root, 'config/mcp/cursor-runtime.json')
  const cursorRuntime = readJson(cursorPath)
  cursorRuntime.excludedServers ??= {}
  cursorRuntime.includedLocalServers ??= {}
  if (
    cursorRuntime.includedLocalServers[UTEKOS_MICROSOFT_ADS_SERVER_ID] !==
    DEFAULT_CURSOR_REASON
  ) {
    cursorRuntime.includedLocalServers[UTEKOS_MICROSOFT_ADS_SERVER_ID] =
      DEFAULT_CURSOR_REASON
    writeJsonAtomic(cursorPath, cursorRuntime)
    changed.push(relative(root, cursorPath))
  }

  const chatgptPath = path.join(root, 'config/mcp/chatgpt-profiles.json')
  const chatgptConfig = readJson(chatgptPath)
  const tunnelProfileChanged = ensureDirectTunnelProfile(chatgptConfig)
  if (tunnelProfileChanged) {
    writeJsonAtomic(chatgptPath, chatgptConfig)
    changed.push(relative(root, chatgptPath))
  }

  const packagePath = path.join(root, 'package.json')
  const packageJson = readJson(packagePath)
  packageJson.scripts ??= {}
  const desiredScripts = createMicrosoftAdsPackageScripts()
  let packageChanged = false
  for (const [name, command] of Object.entries(desiredScripts)) {
    if (packageJson.scripts[name] === command) continue
    packageJson.scripts[name] = command
    packageChanged = true
  }
  if (packageChanged) {
    writeJsonAtomic(packagePath, packageJson)
    changed.push(relative(root, packagePath))
  }

  const codexPath = path.join(root, '.codex/config.toml')
  const currentCodex = fs.existsSync(codexPath)
    ? fs.readFileSync(codexPath, 'utf8')
    : ''
  const nextCodex = upsertManagedTomlBlock(
    currentCodex,
    createCodexManagedBlock(root)
  )
  if (nextCodex !== currentCodex) {
    fs.mkdirSync(path.dirname(codexPath), { recursive: true })
    writeTextAtomic(codexPath, nextCodex)
    changed.push(relative(root, codexPath))
  }

  if (runBuild) {
    runRequired(root, runner, 'pnpm', ['mcp:build'])
  }

  return {
    repoRoot: root,
    changed,
    generatedCursorConfig: runBuild,
    codexConfig: relative(root, codexPath),
    tunnelTarget: UTEKOS_MICROSOFT_ADS_TUNNEL_TARGET
  }
}

export function ensureDirectTunnelProfile(config) {
  config.directTunnelProfiles ??= []
  if (!Array.isArray(config.directTunnelProfiles)) {
    throw new Error(
      'config/mcp/chatgpt-profiles.json directTunnelProfiles must be an array when present.'
    )
  }

  const allProfiles = [
    ...(Array.isArray(config.profiles) ? config.profiles : []),
    ...config.directTunnelProfiles
  ]

  const existingIndex = config.directTunnelProfiles.findIndex(
    item =>
      item?.id === UTEKOS_MICROSOFT_ADS_TUNNEL_PROFILE_ID ||
      item?.tunnelTarget === UTEKOS_MICROSOFT_ADS_TUNNEL_TARGET
  )
  const existing =
    existingIndex >= 0 ? config.directTunnelProfiles[existingIndex] : null

  const healthAddr =
    existing?.healthAddr ?? allocateHealthAddress(allProfiles, 8091)
  const mcpPort = existing?.mcpPort ?? allocateMcpPort(allProfiles, 8891)

  const desired = {
    ...(existing ?? {}),
    id: UTEKOS_MICROSOFT_ADS_TUNNEL_PROFILE_ID,
    name: 'Utekos ChatGPT Microsoft Ads',
    mode: 'read-verify',
    defaultForChatGPT: false,
    tunnelTarget: UTEKOS_MICROSOFT_ADS_TUNNEL_TARGET,
    tunnelProfile: 'utekos-chatgpt-microsoft-ads',
    mcpCommand:
      'node ${repoRoot}/scripts/mcp/utekos-microsoft-ads-server.mjs',
    mcpSurface: 'utekos-microsoft-ads-read-verify',
    healthAddr,
    mcpPort,
    canonicalTools: [...UTEKOS_MICROSOFT_ADS_TOOLS]
  }

  if (existingIndex >= 0) {
    if (isDeepEqual(config.directTunnelProfiles[existingIndex], desired)) {
      return false
    }
    config.directTunnelProfiles[existingIndex] = desired
    return true
  }

  config.directTunnelProfiles.push(desired)
  return true
}

export function createCodexManagedBlock(repoRoot) {
  const root = path.resolve(repoRoot)
  const tools = UTEKOS_MICROSOFT_ADS_TOOLS.map(
    tool => `  ${tomlString(tool)}`
  ).join(',\n')

  return [
    CODEX_BEGIN,
    '# Managed by scripts/mcp/register-utekos-microsoft-ads.mjs.',
    '# This local file is gitignored; cwd is therefore intentionally machine-specific.',
    `[mcp_servers.${UTEKOS_MICROSOFT_ADS_SERVER_ID}]`,
    'command = "node"',
    'args = ["scripts/mcp/utekos-microsoft-ads-server.mjs"]',
    `cwd = ${tomlString(root)}`,
    'enabled = true',
    'required = false',
    'startup_timeout_sec = 20',
    'tool_timeout_sec = 180',
    'default_tools_approval_mode = "auto"',
    'enabled_tools = [',
    tools,
    ']',
    '',
    '# Official Microsoft Advertising remote MCP. OAuth is completed by the MCP client.',
    `[mcp_servers.${MICROSOFT_ADS_OFFICIAL_SERVER_ID}]`,
    `url = ${tomlString(MICROSOFT_ADS_OFFICIAL_OAUTH_MCP_URL)}`,
    'enabled = true',
    'required = false',
    'startup_timeout_sec = 30',
    'tool_timeout_sec = 180',
    CODEX_END
  ].join('\n')
}

export function upsertManagedTomlBlock(source, block) {
  const normalized = source.replaceAll('\r\n', '\n')
  const beginIndex = normalized.indexOf(CODEX_BEGIN)
  const endIndex = normalized.indexOf(CODEX_END)

  if ((beginIndex === -1) !== (endIndex === -1)) {
    throw new Error(
      '.codex/config.toml contains only one Microsoft Ads managed marker. Repair the marker pair before running registration.'
    )
  }

  if (
    beginIndex === -1 &&
    (normalized.includes(`[mcp_servers.${UTEKOS_MICROSOFT_ADS_SERVER_ID}]`) ||
      normalized.includes(`[mcp_servers.${MICROSOFT_ADS_OFFICIAL_SERVER_ID}]`))
  ) {
    throw new Error(
      '.codex/config.toml already contains an unmanaged Microsoft Ads MCP table. Remove or migrate that table before running registration to avoid duplicate TOML tables.'
    )
  }

  if (beginIndex !== -1) {
    if (endIndex < beginIndex) {
      throw new Error(
        '.codex/config.toml Microsoft Ads managed markers are out of order.'
      )
    }
    const endExclusive = endIndex + CODEX_END.length
    const before = normalized.slice(0, beginIndex).replace(/\s*$/, '')
    const after = normalized.slice(endExclusive).replace(/^\s*/, '')
    return joinTextSections(before, block, after)
  }

  return joinTextSections(normalized.trimEnd(), block)
}

function allocateHealthAddress(profiles, startPort) {
  const used = new Set(
    profiles
      .map(item => item?.healthAddr)
      .filter(value => typeof value === 'string')
  )

  for (let port = startPort; port < startPort + 100; port += 1) {
    const candidate = `127.0.0.1:${port}`
    if (!used.has(candidate)) return candidate
  }

  throw new Error('Unable to allocate a free tunnel health address.')
}

function allocateMcpPort(profiles, startPort) {
  const used = new Set(
    profiles
      .map(item => String(item?.mcpPort ?? ''))
      .filter(Boolean)
  )

  for (let port = startPort; port < startPort + 100; port += 1) {
    const candidate = String(port)
    if (!used.has(candidate)) return candidate
  }

  throw new Error('Unable to allocate a free tunnel MCP port.')
}

function assertRepoShape(repoRoot) {
  for (const item of REQUIRED_PATHS) {
    const absolute = path.join(repoRoot, item)
    if (!fs.existsSync(absolute)) {
      throw new Error(`Required repo path is missing: ${item}`)
    }
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJsonAtomic(filePath, value) {
  writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeTextAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const mode = fs.existsSync(filePath)
    ? fs.statSync(filePath).mode & 0o777
    : 0o644
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmpPath, value, { encoding: 'utf8', mode })
  fs.renameSync(tmpPath, filePath)
}

function joinTextSections(...sections) {
  const nonEmpty = sections
    .map(section => section?.trim())
    .filter(Boolean)
  return `${nonEmpty.join('\n\n')}\n`
}

function tomlString(value) {
  return JSON.stringify(String(value))
}

function isDeepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function relative(root, filePath) {
  return path.relative(root, filePath) || '.'
}

function runRequired(cwd, runner, command, args) {
  const result = runner(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit'
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status ?? 'unknown'}): ${command} ${args.join(' ')}`
    )
  }
}

function parseArgs(argv) {
  return {
    skipBuild: argv.includes('--skip-build'),
    json: argv.includes('--json')
  }
}

function isDirectExecution() {
  const argvPath = process.argv[1]
  if (!argvPath) return false
  return path.resolve(argvPath) === fileURLToPath(import.meta.url)
}

if (isDirectExecution()) {
  const args = parseArgs(process.argv.slice(2))
  try {
    const result = applyMicrosoftAdsRegistration({
      runBuild: !args.skipBuild
    })

    if (args.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    } else {
      console.log('Microsoft Ads MCP registration applied.')
      console.log(
        result.changed.length > 0
          ? `Changed: ${result.changed.join(', ')}`
          : 'Changed: none (already idempotent)'
      )
      console.log(
        result.generatedCursorConfig
          ? 'Cursor MCP config regenerated via pnpm mcp:build.'
          : 'Cursor MCP config build skipped (--skip-build).'
      )
      console.log(`Codex config: ${result.codexConfig}`)
      console.log(`Tunnel target: ${result.tunnelTarget}`)
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}
