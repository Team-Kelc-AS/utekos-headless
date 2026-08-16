#!/usr/bin/env node

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const serverName = process.argv[2]
const placeholderPattern = /\$\{([A-Z0-9_]+)\}/g

if (!serverName) {
  console.error('Usage: node scripts/mcp/run-server.mjs <server-name>')
  process.exit(1)
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function loadEnvMap() {
  const env = {}
  const envMcpPath = path.join(root, '.env.mcp.local')
  const envAppPath = path.join(root, '.env.local')

  if (fs.existsSync(envMcpPath)) {
    Object.assign(env, dotenv.parse(fs.readFileSync(envMcpPath, 'utf8')))
  }

  if (fs.existsSync(envAppPath)) {
    const appEnv = dotenv.parse(fs.readFileSync(envAppPath, 'utf8'))
    for (const [key, value] of Object.entries(appEnv)) {
      if (!(key in env) && value !== '') {
        env[key] = value
      }
    }
  }

  return env
}

function resolvePlaceholders(value, env, unresolved) {
  if (typeof value === 'string') {
    return value.replace(placeholderPattern, (match, key) => {
      const resolved = env[key] ?? process.env[key]
      if (resolved === undefined) {
        unresolved.add(key)
        return match
      }

      return resolved
    })
  }

  if (Array.isArray(value)) {
    return value.map(item => resolvePlaceholders(item, env, unresolved))
  }

  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value)) {
      out[key] = resolvePlaceholders(item, env, unresolved)
    }
    return out
  }

  return value
}

function toAbsolutePathIfRelative(value) {
  if (typeof value !== 'string' || value.startsWith('/')) return value
  return path.resolve(root, value)
}

const basePath = path.join(root, 'config/mcp/servers.base.json')
const manifestPath = path.join(root, 'config/mcp/credentials.manifest.json')
const base = readJson(basePath)
const manifest = readJson(manifestPath)
const env = loadEnvMap()

for (const [key, defaultPath] of Object.entries(manifest.pathEnvDefaults ?? {})) {
  if (!(key in env) || env[key] === '') {
    env[key] = defaultPath
  }
}

for (const [key, meta] of Object.entries(manifest.credentialFiles ?? {})) {
  const configuredPath = env[key] && env[key] !== '' ? env[key] : meta.path
  env[key] = toAbsolutePathIfRelative(configuredPath)
}

const server = base.mcpServers?.[serverName]

if (!server) {
  console.error(`Unknown MCP server: ${serverName}`)
  process.exit(1)
}

const unresolved = new Set()
const resolved = resolvePlaceholders(server, env, unresolved)

const isMcpRemote =
  resolved.command === 'npx' &&
  Array.isArray(server.args) &&
  server.args.some(
    arg => typeof arg === 'string' && /^mcp-remote(?:@|$)/.test(arg)
  )

const passthroughEnv = {}
const childArgs = isMcpRemote
  ? server.args.map(arg => {
      if (typeof arg !== 'string') return arg

      for (const match of arg.matchAll(/\$\{([A-Z0-9_]+)\}/g)) {
        const key = match[1]
        const value = env[key] ?? process.env[key]

        if (value === undefined) {
          unresolved.add(key)
        } else {
          passthroughEnv[key] = value
        }
      }

      return arg
    })
  : resolved.args

if (unresolved.size > 0) {
  console.error(`Missing MCP env for ${serverName}: ${[...unresolved].sort().join(', ')}`)
  process.exit(1)
}

if (!resolved.command || !Array.isArray(resolved.args)) {
  console.error(`MCP server ${serverName} is not a stdio command server`)
  process.exit(1)
}

const childEnv = {
  ...process.env,
  ...passthroughEnv,
  ...(resolved.env && typeof resolved.env === 'object' ? resolved.env : {}),
  PATH: [
    path.join(os.homedir(), '.local', 'bin'),
    process.env.PATH
  ].filter(Boolean).join(path.delimiter)
}

const child = spawn(resolved.command, childArgs, {
  cwd: root,
  env: childEnv,
  stdio: 'inherit',
  detached: process.platform !== 'win32'
})

const forwardedSignals = ['SIGINT', 'SIGTERM', 'SIGHUP']
let shuttingDown = false

function signalChildTree(signal) {
  if (!child.pid) return

  try {
    if (process.platform === 'win32') {
      child.kill(signal)
    } else {
      process.kill(-child.pid, signal)
    }
  } catch (error) {
    if (error?.code !== 'ESRCH') {
      console.error(`Failed to forward ${signal} to MCP child tree: ${error.message}`)
    }
  }
}

for (const signal of forwardedSignals) {
  process.on(signal, () => {
    if (shuttingDown) return
    shuttingDown = true

    signalChildTree(signal)

    const forceKillTimer = setTimeout(() => {
      signalChildTree('SIGKILL')
    }, 5000)

    forceKillTimer.unref()
  })
}

child.on('exit', (code, signal) => {
  if (signal) {
    for (const handledSignal of forwardedSignals) {
      process.removeAllListeners(handledSignal)
    }

    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

child.on('error', error => {
  console.error(error.message)
  process.exit(1)
})
