import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

type Check = {
  name: string
  level: 'ok' | 'warn' | 'error'
  message: string
}

const profiles = [
  { name: 'utekos_core_safe', minimumTools: 10 },
  { name: 'utekos_observability_live', minimumTools: 1 },
  { name: 'utekos_commerce_live', minimumTools: 0 },
  { name: 'utekos_research_browser', minimumTools: 10 }
]

function run(command: string, args: string[]) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

function firstLine(value: string | null | undefined): string {
  return (
    (value ?? '')
      .split('\n')
      .find(line => line.trim() !== '')
      ?.trim() ?? ''
  )
}

function countTools(output: string): number | null {
  const match = output.match(/(\d+)\s+tools?/)
  return match ? Number(match[1]) : null
}

function addCommandCheck(
  checks: Check[],
  name: string,
  command: string,
  args: string[]
) {
  const result = run(command, args)

  if (result.status === 0) {
    checks.push({
      name,
      level: 'ok',
      message:
        firstLine(result.stdout) ||
        `${command} ${args.join(' ')}`
    })
    return result
  }

  checks.push({
    name,
    level: 'error',
    message:
      firstLine(result.stderr) ||
      firstLine(result.stdout) ||
      `Failed: ${command} ${args.join(' ')}`
  })
  return result
}

function checkDockerProfiles(checks: Check[]) {
  for (const profile of profiles) {
    const dryRun = run('docker', [
      'mcp',
      'gateway',
      'run',
      '--profile',
      profile.name,
      '--dry-run'
    ])
    checks.push({
      name: `profile:${profile.name}:dry-run`,
      level: dryRun.status === 0 ? 'ok' : 'error',
      message:
        dryRun.status === 0 ?
          'gateway dry-run OK'
        : firstLine(dryRun.stderr) ||
          firstLine(dryRun.stdout) ||
          'gateway dry-run failed'
    })

    const count = run('docker', [
      'mcp',
      'tools',
      'count',
      `--gateway-arg=--profile=${profile.name}`
    ])
    const toolCount = countTools(count.stdout)
    const level =
      count.status !== 0 ? 'error'
      : toolCount === null ? 'warn'
      : toolCount < profile.minimumTools ? 'warn'
      : 'ok'

    checks.push({
      name: `profile:${profile.name}:tools`,
      level,
      message:
        toolCount === null ?
          'tool count unavailable'
        : `${toolCount} tools`
    })
  }
}

function checkClientMappings(checks: Check[]) {
  const dockerProfilesPath = path.join(
    os.homedir(),
    '.docker/mcp/profiles.json'
  )
  if (!fs.existsSync(dockerProfilesPath)) {
    checks.push({
      name: 'client:gordon',
      level: 'warn',
      message: 'Docker MCP profiles.json missing'
    })
  } else {
    const profilesJson = JSON.parse(
      fs.readFileSync(dockerProfilesPath, 'utf8')
    ) as Record<string, { profile?: string }>
    const gordonProfile = profilesJson.gordon?.profile
    checks.push({
      name: 'client:gordon',
      level:
        gordonProfile === 'utekos_core_safe' ? 'ok' : 'warn',
      message:
        gordonProfile ? `profile=${gordonProfile}` : 'not mapped'
    })
  }

  const codexConfigPath = path.join(
    os.homedir(),
    '.codex/config.toml'
  )
  const projectCodexConfigPath = path.join(
    process.cwd(),
    '.codex/config.toml'
  )
  const userCodexConfig =
    fs.existsSync(codexConfigPath) ?
      fs.readFileSync(codexConfigPath, 'utf8')
    : ''
  const projectCodexConfig =
    fs.existsSync(projectCodexConfigPath) ?
      fs.readFileSync(projectCodexConfigPath, 'utf8')
    : ''

  checks.push({
    name: 'client:codex:docker-stdio',
    level:
      userCodexConfig.includes('utekos_core_safe') ? 'ok' : (
        'warn'
      ),
    message:
      userCodexConfig.includes('utekos_core_safe') ?
        'user config references utekos_core_safe'
      : 'not found'
  })

  checks.push({
    name: 'client:codex:sandbox-http',
    level:
      projectCodexConfig.includes('MCP_DOCKER_CORE_HTTP') ? 'ok'
      : 'warn',
    message:
      projectCodexConfig.includes('MCP_DOCKER_CORE_HTTP') ?
        'project config contains sandbox HTTP MCP server'
      : 'not found'
  })
}

function checkSandboxGateway(checks: Check[]) {
  const listeners = run('lsof', [
    '-nP',
    '-iTCP:8812',
    '-sTCP:LISTEN'
  ])

  checks.push({
    name: 'sandbox:mcp-gateway:8812',
    level: listeners.status === 0 ? 'ok' : 'warn',
    message:
      listeners.status === 0 ?
        'streaming gateway is listening'
      : 'not running; start only when using Docker Sandbox Codex'
  })

  const sandbox = run('docker', ['sandbox', 'ls'])
  const hasCodexSandbox = sandbox.stdout.includes(
    'utekos-codex-smoke'
  )
  checks.push({
    name: 'sandbox:utekos-codex-smoke',
    level: hasCodexSandbox ? 'ok' : 'warn',
    message:
      hasCodexSandbox ? 'sandbox exists' : 'sandbox not found'
  })
}

function checkDockerSecrets(checks: Check[]) {
  const secrets = run('docker', ['mcp', 'secret', 'ls'])

  if (secrets.status !== 0) {
    checks.push({
      name: 'secret:docker-mcp',
      level: 'warn',
      message:
        firstLine(secrets.stderr) ||
        firstLine(secrets.stdout) ||
        'secret list unavailable'
    })
    return
  }

  const hasSentry = secrets.stdout.includes(
    'docker/mcp/sentry.auth_token'
  )
  const hasFirecrawl = secrets.stdout.includes(
    'docker/mcp/firecrawl.api_key'
  )

  checks.push({
    name: 'secret:sentry.auth_token',
    level: hasSentry ? 'ok' : 'warn',
    message: hasSentry ? 'configured' : 'missing'
  })

  checks.push({
    name: 'secret:firecrawl.api_key',
    level: hasFirecrawl ? 'ok' : 'warn',
    message:
      hasFirecrawl ? 'configured' : (
        'missing; rotate key before setting'
      )
  })
}

function printChecks(checks: Check[]) {
  for (const check of checks) {
    const label =
      check.level === 'ok' ? 'OK'
      : check.level === 'warn' ? 'WARN'
      : 'ERROR'
    console.log(`${label} ${check.name}: ${check.message}`)
  }
}

function main() {
  const checks: Check[] = []

  addCommandCheck(checks, 'docker:cli', 'docker', [
    'version',
    '--format',
    'Client={{.Client.Version}} Server={{.Server.Version}}'
  ])
  addCommandCheck(checks, 'docker:mcp', 'docker', [
    'mcp',
    'version'
  ])
  checkDockerProfiles(checks)
  checkDockerSecrets(checks)
  checkClientMappings(checks)
  checkSandboxGateway(checks)

  printChecks(checks)

  const errors = checks.filter(check => check.level === 'error')
  const warnings = checks.filter(check => check.level === 'warn')

  if (errors.length > 0) {
    console.error(
      `mcp:docker:doctor failed with ${errors.length} error(s)`
    )
    process.exit(1)
  }

  console.log(
    `mcp:docker:doctor OK${warnings.length > 0 ? ` with ${warnings.length} warning(s)` : ''}`
  )
}

main()
