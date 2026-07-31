#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { randomBytes } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'

import dotenv from 'dotenv'

const root = process.cwd()
const argv = process.argv.slice(2)
const command =
  argv.find(arg => !arg.startsWith('--')) ?? 'check'
const envPath = path.join(root, '.env.tunnel.local')
const appEnvPath = path.join(root, '.env.local')
const examplePath = path.join(root, '.env.tunnel.example')
const chatgptProfilesPath = path.join(
  root,
  'config/mcp/chatgpt-profiles.json'
)

function flagValue(name) {
  const index = argv.indexOf(name)
  if (index === -1) return undefined
  return argv[index + 1]
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  return dotenv.parse(fs.readFileSync(filePath, 'utf8'))
}

function readChatgptProfiles() {
  if (!fs.existsSync(chatgptProfilesPath)) return []
  const config = JSON.parse(
    fs.readFileSync(chatgptProfilesPath, 'utf8')
  )
  return config.profiles ?? []
}

function normalizeTarget(value) {
  return value.trim().replaceAll('-', '_').toUpperCase()
}

function resolveTarget(env) {
  const target =
    flagValue('--target') ?? env.OPENAI_TUNNEL_TARGET ?? ''
  if (!target) return null

  const profile = readChatgptProfiles().find(
    item => item.tunnelTarget === target || item.id === target
  )
  if (!profile) {
    console.error(`Unknown tunnel target: ${target}`)
    console.error(
      `Available targets: ${readChatgptProfiles()
        .map(item => item.tunnelTarget)
        .join(', ')}`
    )
    process.exit(1)
  }

  return profile
}

function applyTargetEnv(env, target) {
  if (!target) return

  const suffix = normalizeTarget(target.tunnelTarget)
  for (const key of [
    'CONTROL_PLANE_TUNNEL_ID',
    'CONTROL_PLANE_API_KEY',
    'CONTROL_PLANE_EXTRA_HEADERS',
    'MCP_GATEWAY_AUTH_TOKEN'
  ]) {
    const targetKey = `${key}_${suffix}`
    if (hasValue(env, targetKey)) env[key] = env[targetKey]
  }

  const targetApiKey = `CONTROL_PLANE_API_KEY_${suffix}`
  if (
    !hasValue(env, targetApiKey) &&
    typeof target.runtimeApiKeyEnv === 'string'
  ) {
    const appEnv = readEnvFile(appEnvPath)
    const runtimeApiKey =
      process.env[target.runtimeApiKeyEnv] ??
      appEnv[target.runtimeApiKeyEnv]
    if (runtimeApiKey?.trim()) {
      env.CONTROL_PLANE_API_KEY = runtimeApiKey
    }
  }

  if (
    target.dedicatedTunnel === true &&
    !hasValue(env, `CONTROL_PLANE_TUNNEL_ID_${suffix}`)
  ) {
    env.CONTROL_PLANE_TUNNEL_ID = ''
  }

  env.OPENAI_TUNNEL_TARGET = target.tunnelTarget
  env.OPENAI_TUNNEL_PROFILE =
    env[`OPENAI_TUNNEL_PROFILE_${suffix}`] ||
    target.tunnelProfile
  env.DOCKER_MCP_PROFILE =
    env[`DOCKER_MCP_PROFILE_${suffix}`] || target.id
  env.OPENAI_TUNNEL_MCP_PORT =
    env[`OPENAI_TUNNEL_MCP_PORT_${suffix}`] ||
    target.mcpPort ||
    '8812'
  env.OPENAI_TUNNEL_HEALTH_ADDR =
    env[`OPENAI_TUNNEL_HEALTH_ADDR_${suffix}`] ||
    target.healthAddr ||
    '127.0.0.1:8080'
  const configuredCommand = target.mcpCommand?.replaceAll(
    '${repoRoot}',
    root
  )
  env.OPENAI_TUNNEL_MCP_COMMAND =
    env[`OPENAI_TUNNEL_MCP_COMMAND_${suffix}`] ||
    configuredCommand ||
    `docker mcp gateway run --profile ${target.id}`
}

function loadTunnelEnv() {
  const env = {
    ...readEnvFile(examplePath),
    ...readEnvFile(envPath),
    ...process.env
  }
  const target = resolveTarget(env)
  applyTargetEnv(env, target)

  env.OPENAI_TUNNEL_PROFILE ||= 'utekos-docker-core'
  env.OPENAI_TUNNEL_MCP_PORT ||= '8812'
  env.OPENAI_TUNNEL_HEALTH_ADDR ||= '127.0.0.1:8080'
  env.DOCKER_MCP_PROFILE ||= 'utekos_core_safe'
  env.OPENAI_TUNNEL_MCP_COMMAND ||= `docker mcp gateway run --profile ${env.DOCKER_MCP_PROFILE}`

  return env
}

function run(commandName, args, options = {}) {
  return spawnSync(commandName, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    env: options.env ?? process.env
  })
}

function commandPath(commandName) {
  if (commandName !== 'tunnel-client') return commandName

  const localBin = path.join(
    process.env.HOME ?? '',
    '.local/bin/tunnel-client'
  )
  if (localBin && fs.existsSync(localBin)) return localBin

  return commandName
}

function tunnelClient() {
  return commandPath('tunnel-client')
}

function spawnForeground(commandName, args, env) {
  const child = spawn(commandPath(commandName), args, {
    cwd: root,
    stdio: 'inherit',
    env
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })

  child.on('error', error => {
    console.error(error.message)
    process.exit(1)
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

function hasValue(env, key) {
  return typeof env[key] === 'string' && env[key].trim() !== ''
}

function required(env, keys) {
  const missing = keys.filter(key => !hasValue(env, key))
  if (missing.length === 0) return

  console.error(
    `Missing required tunnel env: ${missing.join(', ')}`
  )
  console.error(
    'Fill .env.tunnel.local, then rerun this command.'
  )
  process.exit(1)
}

function tunnelEnv(env) {
  const localBin = path.join(
    process.env.HOME ?? '',
    '.local/bin'
  )
  const currentPath = env.PATH ?? process.env.PATH ?? ''
  const pathEntries = currentPath.split(path.delimiter)
  const PATH =
    localBin && !pathEntries.includes(localBin) ?
      `${localBin}${path.delimiter}${currentPath}`
    : currentPath

  return { ...process.env, ...env, PATH }
}

function tunnelProcessPaths(env) {
  const dir = path.join(root, '.agent-artifacts', 'tunnel')
  const safeProfile = env.OPENAI_TUNNEL_PROFILE.replaceAll(
    /[^A-Za-z0-9_.-]/g,
    '_'
  )
  return {
    dir,
    pidPath: path.join(dir, `${safeProfile}.pid`),
    logPath: path.join(dir, `${safeProfile}.log`)
  }
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function matchingTunnelProcesses(env) {
  const port = env.OPENAI_TUNNEL_HEALTH_ADDR.split(':').at(-1)
  const lsof = run('lsof', [
    '-nP',
    `-iTCP:${port}`,
    '-sTCP:LISTEN',
    '-t'
  ])
  const pids = lsof.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  const matches = []

  for (const pid of pids) {
    const ps = run('ps', ['-p', pid, '-o', 'command='])
    const commandLine = ps.stdout.trim()
    if (
      commandLine.includes('tunnel-client run') &&
      commandLine.includes(env.OPENAI_TUNNEL_PROFILE)
    ) {
      matches.push({ pid, commandLine })
    }
  }

  return matches
}

function bootstrapEnv() {
  if (fs.existsSync(envPath)) {
    console.log('.env.tunnel.local already exists')
    return
  }

  const token = `utekos-${randomBytes(32).toString('hex')}`
  const content = fs
    .readFileSync(examplePath, 'utf8')
    .replace(
      'MCP_GATEWAY_AUTH_TOKEN=\n',
      `MCP_GATEWAY_AUTH_TOKEN=${token}\n`
    )

  fs.writeFileSync(envPath, content, 'utf8')
  console.log('Created .env.tunnel.local')
  console.log(
    'Fill CONTROL_PLANE_TUNNEL_ID and CONTROL_PLANE_API_KEY from OpenAI Platform UI.'
  )
}

function check() {
  const env = loadTunnelEnv()
  const checks = []
  const tunnelClientCheck = run(tunnelClient(), ['--version'])

  checks.push({
    name: 'tunnel-client',
    ok: tunnelClientCheck.status === 0,
    message:
      tunnelClientCheck.status === 0 ?
        firstLine(tunnelClientCheck.stdout)
      : 'not installed or not on PATH'
  })

  const docker = run('docker', ['mcp', 'version'])
  checks.push({
    name: 'docker-mcp',
    ok: docker.status === 0,
    message:
      docker.status === 0 ?
        firstLine(docker.stdout)
      : 'docker mcp unavailable'
  })

  for (const key of [
    'CONTROL_PLANE_TUNNEL_ID',
    'CONTROL_PLANE_API_KEY',
    'MCP_GATEWAY_AUTH_TOKEN'
  ]) {
    checks.push({
      name: `env:${key}`,
      ok: hasValue(env, key),
      message: hasValue(env, key) ? 'set' : 'missing'
    })
  }

  checks.push({
    name: 'tunnel:target',
    ok: true,
    message:
      env.OPENAI_TUNNEL_TARGET ?
        `${env.OPENAI_TUNNEL_TARGET} -> ${env.DOCKER_MCP_PROFILE}`
      : `legacy -> ${env.DOCKER_MCP_PROFILE}`
  })

  for (const check of checks) {
    console.log(
      `${check.ok ? 'OK' : 'WARN'} ${check.name}: ${check.message}`
    )
  }

  const hardFailures = checks.filter(
    check => !check.ok && !check.name.startsWith('env:')
  )
  if (hardFailures.length > 0) process.exit(1)
}

function initProfile() {
  const env = loadTunnelEnv()
  required(env, ['CONTROL_PLANE_TUNNEL_ID'])

  const result = run(
    tunnelClient(),
    [
      'init',
      '--sample',
      'sample_mcp_stdio_local',
      '--profile',
      env.OPENAI_TUNNEL_PROFILE,
      '--tunnel-id',
      env.CONTROL_PLANE_TUNNEL_ID,
      '--mcp-command',
      env.OPENAI_TUNNEL_MCP_COMMAND,
      '--health-listen-addr',
      env.OPENAI_TUNNEL_HEALTH_ADDR,
      '--control-plane-api-key-ref',
      'env:CONTROL_PLANE_API_KEY',
      '--force'
    ],
    { env: tunnelEnv(env) }
  )

  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
  process.exit(result.status ?? 0)
}

function doctor() {
  const env = loadTunnelEnv()
  required(env, [
    'CONTROL_PLANE_TUNNEL_ID',
    'CONTROL_PLANE_API_KEY',
    'MCP_GATEWAY_AUTH_TOKEN'
  ])

  const runningProcesses = matchingTunnelProcesses(env)
  const doctorArgs = [
    'doctor',
    '--profile',
    env.OPENAI_TUNNEL_PROFILE,
    '--explain'
  ]

  if (runningProcesses.length > 0) {
    doctorArgs.push('--health.listen-addr', '127.0.0.1:0')
  }

  const result = run(tunnelClient(), doctorArgs, {
    env: tunnelEnv(env)
  })

  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')

  if ((result.status ?? 0) !== 0) {
    process.exit(result.status ?? 1)
  }

  if (runningProcesses.length === 0) {
    process.exit(0)
  }

  const healthUrl = `http://${env.OPENAI_TUNNEL_HEALTH_ADDR}/healthz`
  const readyUrl = `http://${env.OPENAI_TUNNEL_HEALTH_ADDR}/readyz`
  const health = run('curl', ['-fsS', healthUrl])
  const ready = run('curl', ['-fsS', readyUrl])
  const liveChecks = [
    {
      name: 'live_runtime_owner',
      ok: true,
      message: `${env.OPENAI_TUNNEL_PROFILE} pid ${runningProcesses.map(item => item.pid).join(', ')}`
    },
    {
      name: 'live_healthz',
      ok: health.status === 0,
      message: healthUrl
    },
    {
      name: 'live_readyz',
      ok: ready.status === 0,
      message: readyUrl
    }
  ]

  for (const check of liveChecks) {
    console.log(
      `CHECK ${check.name.padEnd(24)} ${check.ok ? 'PASS' : 'FAIL'} ${check.message}`
    )
  }

  const failedLiveChecks = liveChecks.filter(check => !check.ok)
  if (failedLiveChecks.length > 0) {
    console.error(
      `FAILED_CHECKS ${failedLiveChecks.map(check => check.name).join(' ')}`
    )
    process.exit(2)
  }
}

function gateway() {
  const env = loadTunnelEnv()
  required(env, ['MCP_GATEWAY_AUTH_TOKEN'])

  spawnForeground(
    'docker',
    [
      'mcp',
      'gateway',
      'run',
      '--profile',
      env.DOCKER_MCP_PROFILE,
      '--transport',
      'streaming',
      '--port',
      env.OPENAI_TUNNEL_MCP_PORT
    ],
    tunnelEnv(env)
  )
}

function stopTunnel() {
  const env = loadTunnelEnv()
  const profile = env.OPENAI_TUNNEL_PROFILE
  const { pidPath } = tunnelProcessPaths(env)
  const matches = matchingTunnelProcesses(env)

  if (matches.length === 0) {
    console.log(
      `No tunnel listener found on ${env.OPENAI_TUNNEL_HEALTH_ADDR}`
    )
    if (fs.existsSync(pidPath)) fs.rmSync(pidPath)
    return
  }

  let stopped = 0
  for (const { pid } of matches) {
    process.kill(Number(pid), 'SIGTERM')
    console.log(`Stopped ${profile} pid ${pid}`)
    stopped += 1
  }

  if (fs.existsSync(pidPath)) fs.rmSync(pidPath)

  if (stopped === 0) {
    console.log(
      `No matching tunnel-client process found for ${profile}`
    )
  }
}

function statusTunnel() {
  const env = loadTunnelEnv()
  const { pidPath, logPath } = tunnelProcessPaths(env)
  const matches = matchingTunnelProcesses(env)
  const pid =
    matches[0]?.pid ??
    (fs.existsSync(pidPath) ?
      fs.readFileSync(pidPath, 'utf8').trim()
    : '')
  const pidAlive = pid ? processIsAlive(Number(pid)) : false
  const healthUrl = `http://${env.OPENAI_TUNNEL_HEALTH_ADDR}/healthz`
  const readyUrl = `http://${env.OPENAI_TUNNEL_HEALTH_ADDR}/readyz`
  const health = run('curl', ['-fsS', healthUrl])
  const ready = run('curl', ['-fsS', readyUrl])

  console.log(`profile=${env.OPENAI_TUNNEL_PROFILE}`)
  console.log(`target=${env.OPENAI_TUNNEL_TARGET || 'legacy'}`)
  console.log(`mcp_command=${env.OPENAI_TUNNEL_MCP_COMMAND}`)
  console.log(`health_addr=${env.OPENAI_TUNNEL_HEALTH_ADDR}`)
  console.log(`ui=http://${env.OPENAI_TUNNEL_HEALTH_ADDR}/ui`)
  console.log(`pid=${pid || '-'}`)
  console.log(`pid_alive=${pidAlive}`)
  console.log(`listener_matches=${matches.length}`)
  console.log(
    `healthz=${health.status === 0 ? 'ok' : 'unavailable'}`
  )
  console.log(
    `readyz=${ready.status === 0 ? 'ok' : 'unavailable'}`
  )
  console.log(`log=${logPath}`)

  if (matches.length === 0 || health.status !== 0)
    process.exit(1)
}

function startTunnel() {
  const env = loadTunnelEnv()
  required(env, [
    'CONTROL_PLANE_TUNNEL_ID',
    'CONTROL_PLANE_API_KEY',
    'MCP_GATEWAY_AUTH_TOKEN'
  ])

  const existing = matchingTunnelProcesses(env)
  if (existing.length > 0) {
    console.log(
      `Tunnel already running for ${env.OPENAI_TUNNEL_PROFILE} pid ${existing.map(item => item.pid).join(', ')}`
    )
    statusTunnel()
    return
  }

  const { dir, pidPath, logPath } = tunnelProcessPaths(env)
  fs.mkdirSync(dir, { recursive: true })
  const out = fs.openSync(logPath, 'a')
  const err = fs.openSync(logPath, 'a')
  const child = spawn(
    tunnelClient(),
    ['run', '--profile', env.OPENAI_TUNNEL_PROFILE],
    {
      cwd: root,
      detached: true,
      stdio: ['ignore', out, err],
      env: tunnelEnv(env)
    }
  )
  child.unref()
  fs.closeSync(out)
  fs.closeSync(err)
  fs.writeFileSync(pidPath, String(child.pid), 'utf8')
  console.log(
    `Started ${env.OPENAI_TUNNEL_PROFILE} pid ${child.pid}`
  )
  console.log(`Log: ${logPath}`)

  const sleep = run('sleep', ['2'])
  if (sleep.status !== 0) {
    console.log(
      'Sleep command unavailable; skipping startup wait.'
    )
  }

  statusTunnel()
}

function runTunnel() {
  const env = loadTunnelEnv()
  required(env, [
    'CONTROL_PLANE_TUNNEL_ID',
    'CONTROL_PLANE_API_KEY',
    'MCP_GATEWAY_AUTH_TOKEN'
  ])

  spawnForeground(
    'tunnel-client',
    ['run', '--profile', env.OPENAI_TUNNEL_PROFILE],
    tunnelEnv(env)
  )
}

function listTargets() {
  for (const profile of readChatgptProfiles()) {
    console.log(
      `${profile.tunnelTarget}: ${profile.id} (${profile.tunnelProfile})`
    )
  }
}

function usage() {
  console.log(
    'Usage: node scripts/mcp/openai-tunnel.mjs <bootstrap-env|check|init|doctor|gateway|run|start|status|stop|list-targets> [--target insight|source-insight|browser|shadcn|live-ops|shopify-readonly|codex-bridge|google-analytics]'
  )
}

switch (command) {
  case 'bootstrap-env':
    bootstrapEnv()
    break
  case 'check':
    check()
    break
  case 'init':
    initProfile()
    break
  case 'doctor':
    doctor()
    break
  case 'gateway':
    gateway()
    break
  case 'run':
    runTunnel()
    break
  case 'start':
    startTunnel()
    break
  case 'status':
    statusTunnel()
    break
  case 'stop':
    stopTunnel()
    break
  case 'list-targets':
    listTargets()
    break
  default:
    usage()
    process.exit(1)
}
