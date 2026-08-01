import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {
  PATHS,
  collectPlaceholders,
  isRemoteMcpServer,
  loadCursorRuntimePolicy,
  loadEnvMap,
  loadJson,
  loadManifest,
  toAbsolutePathIfRelative,
  type McpServers
} from './lib'

type DoctorIssue = { level: 'error' | 'warn'; message: string }

const nonSecretInlineEnv = new Set([
  'GA_PROPERTY_ID',
  'GA_MEASUREMENT_ID',
  'GOOGLE_CLOUD_QUOTA_PROJECT',
  'GTM_PROJECT_ID',
  'META_APP_ID',
  'META_AUTO_REFRESH',
  'META_BUSINESS_ID',
  'META_DEVTOOLS_MCP_CLIENT_ID'
])

function main() {
  const issues: DoctorIssue[] = []
  const manifest = loadManifest()
  const cursorRuntimePolicy = loadCursorRuntimePolicy()

  if (!fs.existsSync(PATHS.envMcp)) {
    issues.push({
      level: 'error',
      message: `Missing ${path.relative(process.cwd(), PATHS.envMcp)} — copy .env.mcp.example and fill in values`
    })
  }

  const env = loadEnvMap()
  const base = loadJson<{ mcpServers: McpServers }>(PATHS.base)
  const placeholders = [
    ...collectPlaceholders(base.mcpServers)
  ].sort()

  for (const serverName of Object.keys(
    cursorRuntimePolicy.excludedServers
  )) {
    const server = base.mcpServers[serverName]
    if (!server) {
      issues.push({
        level: 'error',
        message: `Unknown Cursor runtime exclusion: ${serverName}`
      })
      continue
    }

    if (!isRemoteMcpServer(server)) {
      issues.push({
        level: 'error',
        message: `Cursor runtime exclusion must reference a remote server: ${serverName}`
      })
    }
  }

  for (const serverName of Object.keys(
    cursorRuntimePolicy.includedLocalServers
  )) {
    const server = base.mcpServers[serverName]
    if (!server) {
      issues.push({
        level: 'error',
        message: `Unknown Cursor runtime local include: ${serverName}`
      })
      continue
    }

    if (isRemoteMcpServer(server)) {
      issues.push({
        level: 'error',
        message: `Cursor runtime local include must reference a non-remote server: ${serverName}`
      })
    }
  }

  for (const [key, meta] of Object.entries(
    manifest.requiredEnv
  )) {
    if (!env[key] || env[key].trim() === '') {
      issues.push({
        level: 'error',
        message: `Missing required env ${key} (${meta.description ?? meta.servers.join(', ')})`
      })
    }
  }

  for (const key of placeholders) {
    if (key in manifest.requiredEnv) continue
    if (!env[key] || env[key].trim() === '') {
      const optional = manifest.optionalEnv[key]
      issues.push({
        level: 'warn',
        message:
          optional ?
            `Optional env ${key} is empty (used by ${optional.servers.join(', ')})`
          : `Env ${key} referenced in base config but not set`
      })
    }
  }

  for (const [envKey, meta] of Object.entries(
    manifest.credentialFiles
  )) {
    const configuredPath =
      env[envKey] ?
        toAbsolutePathIfRelative(env[envKey])
      : path.join(process.cwd(), meta.path)

    if (!fs.existsSync(configuredPath)) {
      issues.push({
        level: meta.required ? 'error' : 'warn',
        message: `Credential file missing for ${envKey}: ${configuredPath}`
      })
    }
  }

  if (!fs.existsSync(PATHS.cursorOut)) {
    issues.push({
      level: 'warn',
      message:
        'Generated mcp.json missing — run npm run mcp:build'
    })
  }

  if (!fs.existsSync(PATHS.vscodeOut)) {
    issues.push({
      level: 'warn',
      message:
        'Generated .vscode/mcp.json missing — run npm run mcp:build'
    })
  }

  if (!fs.existsSync(PATHS.cursorRuntimeOut)) {
    issues.push({
      level: 'warn',
      message:
        'Generated .cursor/mcp.remote.json missing — run npm run mcp:build'
    })
  }

  const expectedCursorTarget = path.relative(
    path.dirname(PATHS.cursorSymlink),
    PATHS.cursorRuntimeOut
  )
  if (
    !fs.existsSync(PATHS.cursorSymlink) ||
    !fs.lstatSync(PATHS.cursorSymlink).isSymbolicLink() ||
    fs.readlinkSync(PATHS.cursorSymlink) !== expectedCursorTarget
  ) {
    issues.push({
      level: 'error',
      message:
        'Generated .cursor/mcp.json must link to .cursor/mcp.remote.json — run npm run mcp:build'
    })
  }

  const generatedOutputs = [
    PATHS.cursorOut,
    PATHS.cursorRuntimeOut,
    PATHS.vscodeOut
  ]
  const sensitiveKeys = new Set([
    ...Object.keys(manifest.requiredEnv),
    ...Object.keys(manifest.optionalEnv)
  ])
  const allowedInlineValues = new Set(
    [...nonSecretInlineEnv]
      .map(key => env[key])
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.length >= 8
      )
  )

  for (const key of sensitiveKeys) {
    if (nonSecretInlineEnv.has(key)) continue

    const value = env[key]
    if (
      !value ||
      value.length < 8 ||
      value === 'true' ||
      value === 'false'
    )
      continue
    if (allowedInlineValues.has(value)) continue

    for (const filePath of generatedOutputs) {
      if (!fs.existsSync(filePath)) continue

      const content = fs.readFileSync(filePath, 'utf8')
      if (!content.includes(value)) continue

      issues.push({
        level: 'error',
        message: `Generated MCP config contains inline secret ${key}: ${path.relative(process.cwd(), filePath)}`
      })
    }
  }

  const errors = issues.filter(issue => issue.level === 'error')
  const warnings = issues.filter(issue => issue.level === 'warn')

  if (warnings.length > 0) {
    console.log('Warnings:')
    for (const issue of warnings)
      console.log(`  - ${issue.message}`)
  }

  if (errors.length > 0) {
    console.error('Errors:')
    for (const issue of errors)
      console.error(`  - ${issue.message}`)
    process.exit(1)
  }

  console.log('mcp:doctor OK')
  if (warnings.length > 0) {
    console.log(
      `${warnings.length} warning(s) — MCP servers may be partially configured`
    )
  }
}

main()
