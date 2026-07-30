#!/usr/bin/env node

import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const redirectUri = 'http://localhost:8080/callback'
const clientId = envValue('MICROSOFT_ADS_CLIENT_ID')
const clientSecret = envValue('MICROSOFT_ADS_CLIENT_SECRET')

if (!clientId || !clientSecret) {
  console.error('Missing MICROSOFT_ADS_CLIENT_ID or MICROSOFT_ADS_CLIENT_SECRET in .env.local / .env.mcp.local')
  process.exit(1)
}

const authorizeUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
authorizeUrl.searchParams.set('client_id', clientId)
authorizeUrl.searchParams.set('response_type', 'code')
authorizeUrl.searchParams.set('redirect_uri', redirectUri)
authorizeUrl.searchParams.set('response_mode', 'query')
authorizeUrl.searchParams.set('scope', 'openid offline_access https://ads.microsoft.com/msads.manage')
authorizeUrl.searchParams.set('prompt', 'login')
authorizeUrl.searchParams.set('state', 'utekos-msads')

console.log('Microsoft Ads OAuth listener starting on http://localhost:8080/callback')
console.log('')
console.log('1. Open this URL in your browser and sign in as santini91yt@gmail.com via Microsoft:')
console.log(authorizeUrl.toString())
console.log('')
console.log('2. Click Accept / Godta')
console.log('3. This script will capture the callback and exchange tokens automatically')
console.log('')

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost:8080')
  if (requestUrl.pathname !== '/callback') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }

  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<h1>OAuth failed</h1><p>${error}: ${errorDescription ?? ''}</p>`)
    console.error('OAuth error:', error, errorDescription ?? '')
    server.close()
    process.exit(1)
    return
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>Missing code</h1>')
    return
  }

  try {
    const tokens = await exchangeCode(code)
    upsertEnvValue('.env.mcp.local', 'MICROSOFT_ADS_ACCESS_TOKEN', tokens.access_token)
    upsertEnvValue('.env.mcp.local', 'MICROSOFT_ADS_REFRESH_TOKEN', tokens.refresh_token)

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>Microsoft Ads OAuth OK</h1><p>Tokens saved to .env.mcp.local. You can close this tab.</p>')

    console.log('Token exchange OK')
    console.log(`scope: ${tokens.scope}`)
    console.log(`expires_in: ${tokens.expires_in}s`)
    console.log('Updated .env.mcp.local')
    console.log('Next: npm run microsoft-ads:fetch-uet-auth-key')
  } catch (exchangeError) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<h1>Token exchange failed</h1><pre>${String(exchangeError)}</pre>`)
    console.error(String(exchangeError))
    server.close()
    process.exit(1)
    return
  }

  server.close()
  process.exit(0)
})

server.listen(8080, '127.0.0.1', () => {
  console.log('Waiting for OAuth callback...')
})

setTimeout(() => {
  console.error('Timed out after 10 minutes waiting for OAuth callback.')
  server.close()
  process.exit(1)
}, 10 * 60 * 1000)

function readEnvFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) return new Map()
  const values = new Map()
  for (const line of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }
    values.set(match[1], value)
  }
  return values
}

function envValue(key) {
  if (process.env[key]) return process.env[key]
  for (const file of ['.env.mcp.local', '.env.local']) {
    const value = readEnvFile(file).get(key)
    if (value) return value
  }
  return ''
}

function upsertEnvValue(relativePath, key, value) {
  const fullPath = path.join(repoRoot, relativePath)
  const lines = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8').split(/\r?\n/) : []
  const prefix = `${key}=`
  let replaced = false
  const next = lines.map((line) => {
    if (line.startsWith(prefix)) {
      replaced = true
      return `${key}=${value}`
    }
    return line
  })
  if (!replaced) next.push(`${key}=${value}`)
  fs.writeFileSync(fullPath, `${next.join('\n').replace(/\n?$/, '\n')}`)
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    scope: 'https://ads.microsoft.com/msads.manage offline_access'
  })

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  const data = await response.json()
  if (!response.ok || typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') {
    throw new Error(data.error_description || data.error || `HTTP ${response.status}`)
  }

  return data
}
