import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import dotenv from 'dotenv'

export const ROOT = process.cwd()

export const PATHS = {
  base: path.join(ROOT, 'config/mcp/servers.base.json'),
  vscodeOverrides: path.join(
    ROOT,
    'config/mcp/vscode-overrides.json'
  ),
  manifest: path.join(
    ROOT,
    'config/mcp/credentials.manifest.json'
  ),
  envMcp: path.join(ROOT, '.env.mcp.local'),
  envApp: path.join(ROOT, '.env.local'),
  cursorOut: path.join(ROOT, 'mcp.json'),
  vscodeOut: path.join(ROOT, '.vscode/mcp.json'),
  cursorSymlink: path.join(ROOT, '.cursor/mcp.json')
} as const

export type McpServerConfig = Record<string, unknown>
export type McpServers = Record<string, McpServerConfig>

export type CredentialsManifest = {
  envFiles: { primary: string; fallback: string }
  credentialFiles: Record<
    string,
    { path: string; servers: string[]; required: boolean }
  >
  requiredEnv: Record<
    string,
    { servers: string[]; description?: string }
  >
  optionalEnv: Record<string, { servers: string[] }>
  pathEnvDefaults: Record<string, string>
}

const PLACEHOLDER_PATTERN = /\$\{([A-Z0-9_]+)\}/g

export function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

export function loadManifest(): CredentialsManifest {
  return loadJson<CredentialsManifest>(PATHS.manifest)
}

export function loadEnvMap(): Record<string, string> {
  const manifest = loadManifest()
  const env: Record<string, string> = {}

  if (fs.existsSync(PATHS.envMcp)) {
    Object.assign(
      env,
      dotenv.parse(fs.readFileSync(PATHS.envMcp, 'utf8'))
    )
  }

  if (fs.existsSync(PATHS.envApp)) {
    const appEnv = dotenv.parse(
      fs.readFileSync(PATHS.envApp, 'utf8')
    )
    for (const [key, value] of Object.entries(appEnv)) {
      if (!(key in env) && value !== '') {
        env[key] = value
      }
    }
  }

  for (const [key, defaultPath] of Object.entries(
    manifest.pathEnvDefaults
  )) {
    if (!(key in env) || env[key] === '') {
      env[key] = defaultPath
    }
  }

  return env
}

export function collectPlaceholders(
  value: unknown,
  found = new Set<string>()
): Set<string> {
  if (typeof value === 'string') {
    for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
      const key = match[1]
      if (key) found.add(key)
    }
    return found
  }

  if (Array.isArray(value)) {
    for (const item of value) collectPlaceholders(item, found)
    return found
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value))
      collectPlaceholders(item, found)
  }

  return found
}

export function resolvePlaceholders(
  value: unknown,
  env: Record<string, string>,
  unresolved: Set<string>
): unknown {
  if (typeof value === 'string') {
    return value.replace(
      PLACEHOLDER_PATTERN,
      (match, key: string) => {
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
      resolvePlaceholders(item, env, unresolved)
    )
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      out[key] = resolvePlaceholders(item, env, unresolved)
    }
    return out
  }

  return value
}

export function resolveCredentialPaths(
  servers: McpServers,
  env: Record<string, string>,
  manifest: CredentialsManifest
): McpServers {
  const resolved = structuredClone(servers) as McpServers

  for (const [envKey, meta] of Object.entries(
    manifest.credentialFiles
  )) {
    const absolutePath = path.join(ROOT, meta.path)
    if (!fs.existsSync(absolutePath)) {
      continue
    }

    env[envKey] =
      env[envKey] && env[envKey] !== '' ?
        path.resolve(ROOT, env[envKey])
      : absolutePath

    for (const serverName of meta.servers) {
      const server = resolved[serverName]
      if (!server) continue

      if (server.env && typeof server.env === 'object') {
        const serverEnv = server.env as Record<string, string>
        if (envKey in serverEnv) {
          serverEnv[envKey] = env[envKey]
        }
      }

      if (Array.isArray(server.args)) {
        server.args = server.args.map(arg =>
          (
            typeof arg === 'string'
            && arg.includes(`\${${envKey}}`)
          ) ?
            env[envKey]
          : arg
        )
      }
    }
  }

  return resolved
}

export function toAbsolutePathIfRelative(value: string): string {
  if (value.startsWith('/')) return value
  return path.resolve(ROOT, value)
}

export function cursorToVscodeServer(
  name: string,
  config: McpServerConfig
): McpServerConfig {
  const vscodeConfig = structuredClone(config) as McpServerConfig

  if (vscodeConfig.transport === 'http') {
    delete vscodeConfig.transport
  }

  if (vscodeConfig.httpUrl) {
    vscodeConfig.url = vscodeConfig.httpUrl
    delete vscodeConfig.httpUrl
  }

  delete vscodeConfig.type
  delete vscodeConfig.tools
  delete vscodeConfig.autoApprove
  delete vscodeConfig.disabled
  delete vscodeConfig.authProviderType
  delete vscodeConfig.oauth
  delete vscodeConfig.timeout

  if (name === 'upstash-context7') {
    return {
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp'],
      env: vscodeConfig.env ?? {}
    }
  }

  return vscodeConfig
}

export function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8'
  )
}

export function ensureCursorSymlink() {
  const target = path.relative(
    path.dirname(PATHS.cursorSymlink),
    PATHS.cursorOut
  )

  if (fs.existsSync(PATHS.cursorSymlink)) {
    const stat = fs.lstatSync(PATHS.cursorSymlink)
    if (stat.isSymbolicLink()) {
      const current = fs.readlinkSync(PATHS.cursorSymlink)
      if (current === target) {
        return
      }
    }
    fs.rmSync(PATHS.cursorSymlink, { force: true })
  }

  fs.mkdirSync(path.dirname(PATHS.cursorSymlink), {
    recursive: true
  })
  fs.symlinkSync(target, PATHS.cursorSymlink)
}
