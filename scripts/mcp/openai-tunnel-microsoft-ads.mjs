#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'


const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(moduleDir, '../..')
const configPath = path.join(
  repoRoot,
  'config/mcp/chatgpt-profiles.json'
)
const delegatePath = path.join(moduleDir, 'openai-tunnel.mjs')
const target = 'microsoft-ads'
const targetSuffix = 'MICROSOFT_ADS'
const targetScopedControlPlaneKeys = Object.freeze([
  'CONTROL_PLANE_TUNNEL_ID',
  'CONTROL_PLANE_API_KEY',
  'CONTROL_PLANE_EXTRA_HEADERS',
  'MCP_GATEWAY_AUTH_TOKEN'
])

export function loadMicrosoftAdsTunnelProfile({
  root = repoRoot,
  profileConfigPath = configPath
} = {}) {
  if (!fs.existsSync(profileConfigPath)) {
    throw new Error(
      'Missing config/mcp/chatgpt-profiles.json. Run the Microsoft Ads MCP registration first.'
    )
  }

  const config = JSON.parse(fs.readFileSync(profileConfigPath, 'utf8'))
  const directProfiles = config.directTunnelProfiles ?? []
  if (!Array.isArray(directProfiles)) {
    throw new Error('directTunnelProfiles must be an array.')
  }

  const profile = directProfiles.find(
    item => item?.tunnelTarget === target
  )
  if (!profile) {
    throw new Error(
      'Microsoft Ads tunnel target is not registered. Run pnpm mcp:microsoft-ads:register first.'
    )
  }

  const required = [
    'tunnelProfile',
    'mcpCommand',
    'healthAddr',
    'mcpPort'
  ]
  for (const key of required) {
    if (typeof profile[key] !== 'string' || profile[key].trim() === '') {
      throw new Error(
        `Microsoft Ads tunnel profile is missing ${key}.`
      )
    }
  }

  return {
    ...profile,
    mcpCommand: profile.mcpCommand.replaceAll('${repoRoot}', root)
  }
}

export function configureMicrosoftAdsTunnelEnvironment({
  env = process.env,
  profile = loadMicrosoftAdsTunnelProfile()
} = {}) {
  applyTargetScopedControlPlaneEnvironment(env)

  env.OPENAI_TUNNEL_PROFILE =
    env.MICROSOFT_ADS_TUNNEL_PROFILE ?? profile.tunnelProfile
  env.OPENAI_TUNNEL_MCP_COMMAND =
    env.MICROSOFT_ADS_TUNNEL_MCP_COMMAND ?? profile.mcpCommand
  env.OPENAI_TUNNEL_MCP_PORT =
    env.MICROSOFT_ADS_TUNNEL_MCP_PORT ?? profile.mcpPort
  env.OPENAI_TUNNEL_HEALTH_ADDR =
    env.MICROSOFT_ADS_TUNNEL_HEALTH_ADDR ?? profile.healthAddr

  // The generic tunnel runner resolves --target only from config.profiles.
  // This wrapper owns the direct Microsoft Ads target, so delegate without one.
  delete env.OPENAI_TUNNEL_TARGET

  return env
}


export function applyTargetScopedControlPlaneEnvironment(env = process.env) {
  for (const key of targetScopedControlPlaneKeys) {
    const scopedKey = `${key}_${targetSuffix}`
    const scopedValue = env[scopedKey]
    if (typeof scopedValue === 'string' && scopedValue.trim() !== '') {
      env[key] = scopedValue
    }
  }
  return env
}

export function parseEnvText(source) {
  const values = {}
  for (const rawLine of source.split(/\r?\n/)) {
    const trimmed = rawLine.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const line = trimmed.startsWith('export ')
      ? trimmed.slice('export '.length).trimStart()
      : trimmed
    const separator = line.indexOf('=')
    if (separator <= 0) continue

    const key = line.slice(0, separator).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

    let value = line.slice(separator + 1).trim()
    if (value.startsWith('"')) {
      if (value.endsWith('"') && value.length >= 2) {
        value = value.slice(1, -1)
      } else {
        value = value.slice(1)
      }
      value = value
        .replaceAll('\\n', '\n')
        .replaceAll('\\r', '\r')
        .replaceAll('\\t', '\t')
        .replaceAll('\\"', '"')
        .replaceAll('\\\\', '\\')
    } else if (value.startsWith("'")) {
      if (value.endsWith("'") && value.length >= 2) {
        value = value.slice(1, -1)
      } else {
        value = value.slice(1)
      }
    } else {
      const comment = value.indexOf('#')
      if (comment !== -1) value = value.slice(0, comment).trimEnd()
    }

    values[key] = value
  }
  return values
}

export function loadLocalTunnelEnvironment({
  root = repoRoot,
  env = process.env
} = {}) {
  for (const fileName of ['.env.tunnel.local', '.env.local']) {
    const filePath = path.join(root, fileName)
    if (!fs.existsSync(filePath)) continue
    const values = parseEnvText(fs.readFileSync(filePath, 'utf8'))
    for (const [key, value] of Object.entries(values)) {
      if (env[key] === undefined) env[key] = value
    }
  }
  return env
}

export function sanitizeDelegateArgv(argv) {
  const result = []
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--target') {
      index += 1
      continue
    }
    if (arg.startsWith('--target=')) continue
    result.push(arg)
  }
  return result
}

async function main() {
  process.chdir(repoRoot)
  loadLocalTunnelEnvironment()

  if (!fs.existsSync(delegatePath)) {
    throw new Error('Missing scripts/mcp/openai-tunnel.mjs.')
  }

  configureMicrosoftAdsTunnelEnvironment()
  const delegateArgs = sanitizeDelegateArgv(process.argv.slice(2))
  process.argv = [
    process.argv[0],
    delegatePath,
    ...(delegateArgs.length > 0 ? delegateArgs : ['check'])
  ]

  await import(pathToFileURL(delegatePath).href)
}

const argvPath = process.argv[1]
if (argvPath && path.resolve(argvPath) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
