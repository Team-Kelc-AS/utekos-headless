import fs from 'node:fs'
import path from 'node:path'

import {
  PATHS,
  collectPlaceholders,
  ensureCursorSymlink,
  loadEnvMap,
  loadJson,
  loadManifest,
  resolveCredentialPaths,
  resolvePlaceholders,
  toAbsolutePathIfRelative,
  cursorToVscodeServer,
  writeJson,
  type McpServerConfig,
  type McpServers
} from './lib'

const inlinePlaceholderKeys = new Set([
  'GA_PROPERTY_ID',
  'GA_MEASUREMENT_ID',
  'GITHUB_PAT',
  'GOOGLE_CLOUD_QUOTA_PROJECT',
  'GTM_PROJECT_ID',
  'META_APP_ID',
  'META_AUTO_REFRESH',
  'META_BUSINESS_ID',
  'UTEKOS_CSS_INSIGHT_MCP_URL'
])

function isStdioServer(config: McpServerConfig): boolean {
  return (
    typeof config.command === 'string'
    && Array.isArray(config.args)
  )
}

function hasPlaceholders(config: McpServerConfig): boolean {
  return collectPlaceholders(config).size > 0
}

function toRunnerServer(
  name: string,
  config: McpServerConfig
): McpServerConfig {
  return {
    ...('type' in config ?
      { type: config.type }
    : { type: 'stdio' }),
    command: 'node',
    args: [path.join('scripts', 'mcp', 'run-server.mjs'), name],
    ...('tools' in config ? { tools: config.tools } : {}),
    ...('autoApprove' in config ?
      { autoApprove: config.autoApprove }
    : {}),
    ...('disabled' in config ?
      { disabled: config.disabled }
    : {})
  }
}

function resolveClientPlaceholders(
  value: unknown,
  env: Record<string, string>,
  unresolved: Set<string>
): unknown {
  if (typeof value === 'string') {
    return value.replace(
      /\$\{([A-Z0-9_]+)\}/g,
      (match, key: string) => {
        if (!inlinePlaceholderKeys.has(key)) return match

        const resolved = env[key]
        if (resolved === undefined) {
          unresolved.add(key)
          return match
        }

        return resolved
      }
    )
  }

  if (Array.isArray(value)) {
    return value.map(item =>
      resolveClientPlaceholders(item, env, unresolved)
    )
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      out[key] = resolveClientPlaceholders(item, env, unresolved)
    }
    return out
  }

  return value
}

function toClientServer(
  name: string,
  baseConfig: McpServerConfig,
  resolvedConfig: McpServerConfig
): McpServerConfig {
  if (isStdioServer(baseConfig) && hasPlaceholders(baseConfig)) {
    return toRunnerServer(name, baseConfig)
  }

  if (hasPlaceholders(baseConfig)) {
    return resolvedConfig
  }

  return resolvedConfig
}

function main() {
  const base = loadJson<{ mcpServers: McpServers }>(PATHS.base)
  const vscodeOverrides =
    fs.existsSync(PATHS.vscodeOverrides) ?
      loadJson<Record<string, Record<string, unknown>>>(
        PATHS.vscodeOverrides
      )
    : {}
  const manifest = loadManifest()
  const env = loadEnvMap()
  const unresolved = new Set<string>()

  let cursorServers = resolvePlaceholders(
    base.mcpServers,
    env,
    unresolved
  ) as McpServers
  cursorServers = resolveCredentialPaths(
    cursorServers,
    env,
    manifest
  )

  for (const [name, baseConfig] of Object.entries(
    base.mcpServers
  )) {
    const resolvedConfig = cursorServers[name]
    if (!resolvedConfig) {
      throw new Error(
        `Missing resolved MCP server config: ${name}`
      )
    }

    cursorServers[name] = toClientServer(
      name,
      baseConfig,
      resolvedConfig
    )
  }

  for (const server of Object.values(cursorServers)) {
    if (!server.env || typeof server.env !== 'object') continue

    for (const [envKey, envValue] of Object.entries(
      server.env as Record<string, string>
    )) {
      if (
        typeof envValue === 'string'
        && (envValue.endsWith('.json')
          || envKey.endsWith('_JSON')
          || envKey.endsWith('_CREDENTIALS'))
      ) {
        ;(server.env as Record<string, string>)[envKey] =
          toAbsolutePathIfRelative(envValue)
      }
    }
  }

  const vscodeServers: McpServers = {}
  for (const [name, config] of Object.entries(cursorServers)) {
    const raw =
      vscodeOverrides[name] ?
        (resolveClientPlaceholders(
          vscodeOverrides[name],
          env,
          unresolved
        ) as McpServerConfig)
      : config

    vscodeServers[name] = cursorToVscodeServer(name, raw)
  }

  if (unresolved.size > 0) {
    const missing = [...unresolved].sort()
    console.warn(
      `mcp:build warning — unresolved placeholders: ${missing.join(', ')}`
    )
    console.warn(
      'Fill .env.mcp.local (see .env.mcp.example) and re-run npm run mcp:build'
    )
  }

  writeJson(PATHS.cursorOut, { mcpServers: cursorServers })
  writeJson(PATHS.vscodeOut, { mcpServers: vscodeServers })
  ensureCursorSymlink()

  console.log(`Wrote ${PATHS.cursorOut}`)
  console.log(`Wrote ${PATHS.vscodeOut}`)
  console.log(
    `Linked ${PATHS.cursorSymlink} -> ${path.relative(path.dirname(PATHS.cursorSymlink), PATHS.cursorOut)}`
  )
  console.log(`Servers: ${Object.keys(cursorServers).length}`)
}

main()
