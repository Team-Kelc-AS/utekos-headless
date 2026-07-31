#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const configPath = path.join(
  root,
  'config/mcp/chatgpt-profiles.json'
)

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout ?? 120000
  })
}

function firstLine(value) {
  return (
    (value ?? '')
      .split('\n')
      .find(line => line.trim() !== '')
      ?.trim() ?? ''
  )
}

function check(checks, name, level, message) {
  checks.push({ name, level, message })
}

function printChecks(checks) {
  for (const item of checks) {
    const label =
      item.level === 'ok' ? 'OK'
      : item.level === 'warn' ? 'WARN'
      : 'ERROR'
    console.log(`${label} ${item.name}: ${item.message}`)
  }
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

function parseTools(output) {
  return new Set(
    output
      .split('\n')
      .map(line => line.match(/^\s*-\s+(.+?)\s+-\s+/)?.[1])
      .filter(Boolean)
  )
}

function profileServerNames(profile) {
  return new Set(
    (profile?.servers ?? [])
      .map(server => server?.snapshot?.server?.name)
      .filter(Boolean)
  )
}

function checkCanonicalSurface(checks, profile) {
  check(
    checks,
    `profile:${profile.id}:surface-authority`,
    'ok',
    `${profile.mcpSurface ?? 'canonical stdio'} via ${profile.mcpCommand}`
  )

  if (profile.tunnelTarget === 'insight') {
    const canonical = run('npm', ['run', 'mcp:insight:doctor'], {
      timeout: 120000
    })
    check(
      checks,
      `profile:${profile.id}:canonical-surface`,
      canonical.status === 0 ? 'ok' : 'error',
      canonical.status === 0 ?
        'schema-bound Utekos tools OK'
      : firstLine(canonical.stderr) ||
          firstLine(canonical.stdout) ||
          'canonical doctor failed'
    )
  }

  if (profile.tunnelTarget === 'source-insight') {
    const canonical = run(
      'npm',
      ['run', 'mcp:source-insight:doctor'],
      { timeout: 120000 }
    )
    check(
      checks,
      `profile:${profile.id}:canonical-surface`,
      canonical.status === 0 ? 'ok' : 'error',
      canonical.status === 0 ?
        'schema-bound source insight tools OK'
      : firstLine(canonical.stderr) ||
          firstLine(canonical.stdout) ||
          'source insight doctor failed'
    )
  }

  if (profile.tunnelTarget === 'browser') {
    const canonical = run('npm', ['run', 'mcp:browser:doctor'], {
      timeout: 120000
    })
    check(
      checks,
      `profile:${profile.id}:canonical-surface`,
      canonical.status === 0 ? 'ok' : 'error',
      canonical.status === 0 ?
        'schema-bound browser tools OK'
      : firstLine(canonical.stderr) ||
          firstLine(canonical.stdout) ||
          'browser doctor failed'
    )
  }

  if (profile.tunnelTarget === 'shadcn') {
    const canonical = run(
      'npm',
      ['run', 'mcp:shadcn-context:doctor'],
      { timeout: 120000 }
    )
    check(
      checks,
      `profile:${profile.id}:canonical-surface`,
      canonical.status === 0 ? 'ok' : 'error',
      canonical.status === 0 ?
        'schema-bound shadcn workbench tools OK'
      : firstLine(canonical.stderr) ||
          firstLine(canonical.stdout) ||
          'shadcn workbench doctor failed'
    )
  }

  if (profile.tunnelTarget === 'shopify-readonly') {
    const canonical = run(
      'npm',
      ['run', 'mcp:shopify-readonly:doctor'],
      { timeout: 120000 }
    )
    check(
      checks,
      `profile:${profile.id}:canonical-surface`,
      canonical.status === 0 ? 'ok' : 'error',
      canonical.status === 0 ?
        'schema-bound Shopify read-only tools OK'
      : firstLine(canonical.stderr) ||
          firstLine(canonical.stdout) ||
          'Shopify read-only doctor failed'
    )
  }

  if (profile.tunnelTarget === 'codex-bridge') {
    const canonical = run(
      'npm',
      ['run', 'mcp:codex-bridge:doctor'],
      { timeout: 120000 }
    )
    check(
      checks,
      `profile:${profile.id}:canonical-surface`,
      canonical.status === 0 ? 'ok' : 'error',
      canonical.status === 0 ?
        'schema-bound controlled Codex bridge tools OK'
      : firstLine(canonical.stderr) ||
          firstLine(canonical.stdout) ||
          'Codex bridge doctor failed'
    )
  }

  if (profile.tunnelTarget === 'google-analytics') {
    const canonical = run(
      'npm',
      ['run', 'mcp:google-analytics:chatgpt:doctor'],
      { timeout: 180000 }
    )
    check(
      checks,
      `profile:${profile.id}:canonical-surface`,
      canonical.status === 0 ? 'ok' : 'error',
      canonical.status === 0 ?
        'official Google Analytics read-only proxy tools OK'
      : firstLine(canonical.stderr) ||
          firstLine(canonical.stdout) ||
          'Google Analytics ChatGPT doctor failed'
    )
  }

  for (const gap of profile.knownGaps ?? []) {
    check(checks, `profile:${profile.id}:gap`, 'warn', gap)
  }
}

function hasDynamicToolsEnabled() {
  const result = run('docker', ['mcp', 'feature', 'ls'])
  if (result.status !== 0) return null
  return result.stdout.includes('dynamic-tools        enabled')
}

function checkProfile(checks, profile) {
  if (profile.mcpCommand) {
    checkCanonicalSurface(checks, profile)
    return
  }

  const show = run('docker', [
    'mcp',
    'profile',
    'show',
    profile.id,
    '--format',
    'json'
  ])
  if (show.status !== 0) {
    check(
      checks,
      `profile:${profile.id}`,
      'error',
      firstLine(show.stderr) || 'missing'
    )
    return
  }

  const profileJson = JSON.parse(show.stdout)
  const existingServers = profileServerNames(profileJson)
  const missingServers = profile.servers.filter(
    server => !existingServers.has(server)
  )

  check(
    checks,
    `profile:${profile.id}:servers`,
    missingServers.length === 0 ? 'ok' : 'error',
    missingServers.length === 0 ?
      `${existingServers.size} servers`
    : `missing ${missingServers.join(', ')}`
  )

  const dryRun = run('docker', [
    'mcp',
    'gateway',
    'run',
    '--profile',
    profile.id,
    '--dry-run'
  ])
  check(
    checks,
    `profile:${profile.id}:dry-run`,
    dryRun.status === 0 ? 'ok' : 'error',
    dryRun.status === 0 ?
      'gateway dry-run OK'
    : firstLine(dryRun.stderr) ||
        firstLine(dryRun.stdout) ||
        'failed'
  )

  const tools = run('docker', [
    'mcp',
    'tools',
    'ls',
    `--gateway-arg=--profile=${profile.id}`,
    '--format=list'
  ])
  if (tools.status !== 0) {
    check(
      checks,
      `profile:${profile.id}:tools`,
      'error',
      firstLine(tools.stderr) || 'tool list failed'
    )
    return
  }

  const toolNames = parseTools(tools.stdout)
  check(
    checks,
    `profile:${profile.id}:tool-count`,
    'ok',
    `${toolNames.size} tools`
  )

  for (const toolName of profile.expectedTools ?? []) {
    check(
      checks,
      `profile:${profile.id}:expected:${toolName}`,
      toolNames.has(toolName) ? 'ok' : 'error',
      toolNames.has(toolName) ? 'available' : 'missing'
    )
  }

  for (const toolName of profile.forbiddenTools ?? []) {
    const unqualified =
      toolName.includes('.') ?
        toolName.split('.').at(-1)
      : toolName
    check(
      checks,
      `profile:${profile.id}:forbidden:${unqualified}`,
      toolNames.has(unqualified) ? 'error' : 'ok',
      toolNames.has(unqualified) ? 'exposed' : 'not exposed'
    )
  }

  for (const server of profile.directOnlyServers ?? []) {
    check(
      checks,
      `profile:${profile.id}:direct-only:${server}`,
      'warn',
      'not Docker-catalog backed in V1'
    )
  }

  for (const gap of profile.knownGaps ?? []) {
    check(checks, `profile:${profile.id}:gap`, 'warn', gap)
  }
}

function checkSecretPosture(checks, config) {
  const unsafeProfiles = config.profiles.filter(profile => {
    const filesystemPaths =
      profile.config?.['filesystem.paths'] ?? []
    return (
      profile.mode !== 'explicit-write' &&
      filesystemPaths.includes('${repoRoot}')
    )
  })

  check(
    checks,
    'secret-posture:default-filesystem',
    unsafeProfiles.length === 0 ? 'ok' : 'error',
    unsafeProfiles.length === 0 ?
      'default profiles do not mount full repo root'
    : `unsafe profiles: ${unsafeProfiles.map(profile => profile.id).join(', ')}`
  )
}

function main() {
  const checks = []
  const config = loadConfig()

  const docker = run('docker', ['mcp', 'version'])
  check(
    checks,
    'docker:mcp',
    docker.status === 0 ? 'ok' : 'error',
    docker.status === 0 ?
      firstLine(docker.stdout)
    : firstLine(docker.stderr) || 'unavailable'
  )

  const dynamicTools = hasDynamicToolsEnabled()
  if (config.globalDockerFeatures?.['dynamic-tools'] === false) {
    check(
      checks,
      'docker:mcp:dynamic-tools',
      dynamicTools === false ? 'ok'
      : dynamicTools === true ? 'error'
      : 'warn',
      dynamicTools === false ? 'disabled'
      : dynamicTools === true ?
        'enabled; run npm run mcp:chatgpt:apply'
      : 'status unavailable'
    )
  }

  checkSecretPosture(checks, config)

  for (const profile of config.profiles) {
    checkProfile(checks, profile)
  }

  printChecks(checks)

  const errors = checks.filter(item => item.level === 'error')
  const warnings = checks.filter(item => item.level === 'warn')

  if (errors.length > 0) {
    console.error(
      `mcp:chatgpt:doctor failed with ${errors.length} error(s)`
    )
    process.exit(1)
  }

  console.log(
    `mcp:chatgpt:doctor OK${warnings.length > 0 ? ` with ${warnings.length} warning(s)` : ''}`
  )
}

main()
