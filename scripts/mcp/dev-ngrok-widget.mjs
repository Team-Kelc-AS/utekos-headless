#!/usr/bin/env node
/**
 * scripts/mcp/dev-ngrok-widget.mjs
 *
 * Starts the local Utekos CSS Insight MCP server and exposes it over ngrok
 * so you can point a ChatGPT App connector at the HTTPS tunnel URL during
 * widget development — without deploying to Cloud Run.
 *
 * Usage:
 *   node scripts/mcp/dev-ngrok-widget.mjs
 *   # or with a custom port:
 *   PORT=8787 node scripts/mcp/dev-ngrok-widget.mjs
 *
 * Requirements:
 *   pnpm add -D ngrok        (or npm install --save-dev ngrok)
 *   NGROK_API_KEY in .env.local  (already present in your project)
 *
 * The script:
 *   1. Reads NGROK_API_KEY from .env.local (via process.env or dotenv fallback).
 *   2. Starts the CSS Insight MCP server on PORT (default 8787).
 *   3. Opens a persistent ngrok tunnel to that port.
 *   4. Prints the public HTTPS /mcp URL to use in ChatGPT developer mode.
 *   5. On Ctrl-C cleanly closes both the tunnel and the MCP server.
 *
 * ChatGPT connector setup (one-time):
 *   • Open ChatGPT → Settings → Builder profile → Add connector
 *   • Paste the printed URL, e.g. https://<id>.ngrok-free.app/mcp
 *   • Authentication: None (the CSS Insight server is intentionally public)
 *   • Save → the widget tools appear in your ChatGPT App immediately
 *
 * ngrok free-tier note:
 *   Free accounts get a random subdomain on each restart. Use a paid account
 *   (or ngrok's reserved domains feature) if you need a stable URL across
 *   restarts. Set NGROK_DOMAIN=<your-reserved-domain> to use it.
 */

import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'
import process from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')

// ---------------------------------------------------------------------------
// Load .env.local manually if NGROK_API_KEY is not already in the environment
// (avoids requiring dotenv as a hard dependency)
// ---------------------------------------------------------------------------
function loadDotEnvLocal() {
  const envPath = resolve(repoRoot, '.env.local')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const val = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}

loadDotEnvLocal()

const PORT = Number(process.env.PORT ?? 8787)
const NGROK_KEY = process.env.NGROK_API_KEY
const NGROK_DOMAIN = process.env.NGROK_DOMAIN // optional reserved domain
const MCP_PATH = '/mcp'

if (!NGROK_KEY) {
  console.error(
    '[dev-ngrok] ✖  NGROK_API_KEY is not set.\n' +
      '   Add it to .env.local — it is already defined in your .env.local.incomplete.backup\n' +
      '   or copy it from https://dashboard.ngrok.com/get-started/your-authtoken'
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Dynamic import of @ngrok/ngrok (preferred) or legacy "ngrok" package
// ---------------------------------------------------------------------------
async function getNgrokConnect() {
  try {
    const mod = await import('@ngrok/ngrok')
    return async (port, opts) => {
      const listener = await mod.forward({
        addr: port,
        authtoken: opts.authtoken,
        ...(opts.domain ? { domain: opts.domain } : {})
      })
      return listener.url()
    }
  } catch {
    // fall back to legacy "ngrok" package
    const require = createRequire(import.meta.url)
    try {
      const ngrok = require('ngrok')
      return async (port, opts) =>
        ngrok.connect({
          addr: port,
          authtoken: opts.authtoken,
          ...(opts.subdomain ?
            { subdomain: opts.subdomain }
          : {})
        })
    } catch {
      console.error(
        '[dev-ngrok] ✖  Could not find ngrok package.\n' +
          '   Install it:  pnpm add -D @ngrok/ngrok\n' +
          '                OR  npm install --save-dev @ngrok/ngrok'
      )
      process.exit(1)
    }
  }
}

// ---------------------------------------------------------------------------
// Start MCP server (reuse the existing CSS Insight server module)
// ---------------------------------------------------------------------------
async function startMcpServer() {
  process.env.PORT = String(PORT)
  process.env.HOST = '127.0.0.1'
  process.env.UTEKOS_REPO_ROOT = repoRoot

  const serverModule = resolve(
    __dirname,
    'utekos-css-insight-server.mjs'
  )
  const { startServer } = await import(serverModule)
  return startServer()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
;(async () => {
  console.log(
    '[dev-ngrok] Starting Utekos CSS Insight MCP server on port',
    PORT,
    '...'
  )
  const httpListener = await startMcpServer()

  console.log('[dev-ngrok] Opening ngrok tunnel...')
  const connect = await getNgrokConnect()

  let tunnelUrl
  try {
    tunnelUrl = await connect(PORT, {
      authtoken: NGROK_KEY,
      ...(NGROK_DOMAIN ? { domain: NGROK_DOMAIN } : {})
    })
  } catch (err) {
    console.error(
      '[dev-ngrok] ✖  Failed to open tunnel:',
      err.message ?? err
    )
    httpListener.close()
    process.exit(1)
  }

  const mcpUrl = tunnelUrl.replace(/\/$/, '') + MCP_PATH

  console.log()
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  )
  console.log(
    '║  Utekos CSS Insight MCP  —  ngrok dev tunnel active          ║'
  )
  console.log(
    '╠══════════════════════════════════════════════════════════════╣'
  )
  console.log(
    '║  Local MCP:    http://127.0.0.1:' +
      PORT +
      MCP_PATH +
      '                  ║'
  )
  console.log('║  Public MCP:   ' + mcpUrl.padEnd(47) + '║')
  console.log(
    '╠══════════════════════════════════════════════════════════════╣'
  )
  console.log(
    '║  ChatGPT setup:                                              ║'
  )
  console.log(
    '║  1. ChatGPT → Settings → Builder profile → Add connector     ║'
  )
  console.log(
    '║  2. Paste URL above → Auth: None → Save                      ║'
  )
  console.log(
    '║  3. Ask: "Show me the Utekos color palette"                  ║'
  )
  console.log(
    '║     or:  "Show a color card for flame-orange"                ║'
  )
  console.log(
    '╚══════════════════════════════════════════════════════════════╝'
  )
  console.log()
  console.log('  Press Ctrl-C to stop.\n')

  // Cleanly shut down on Ctrl-C
  process.on('SIGINT', () => {
    console.log('\n[dev-ngrok] Shutting down...')
    httpListener.close(() => process.exit(0))
  })
  process.on('SIGTERM', () => {
    httpListener.close(() => process.exit(0))
  })
})()
