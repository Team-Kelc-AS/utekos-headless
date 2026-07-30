#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const callbackUrl = process.argv[2]

if (!callbackUrl || !callbackUrl.includes('code=')) {
  console.error('Usage: node scripts/microsoft-ads/exchange-oauth-callback.mjs "<full localhost callback URL>"')
  process.exit(1)
}

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

const clientId = envValue('MICROSOFT_ADS_CLIENT_ID')
const clientSecret = envValue('MICROSOFT_ADS_CLIENT_SECRET')
if (!clientId || !clientSecret) {
  console.error('Missing MICROSOFT_ADS_CLIENT_ID or MICROSOFT_ADS_CLIENT_SECRET in .env.local / .env.mcp.local')
  process.exit(1)
}

const parsed = new URL(callbackUrl)
const code = parsed.searchParams.get('code')
const redirectUri = `${parsed.protocol}//${parsed.host}${parsed.pathname}`
if (!code) {
  console.error('No code= parameter found in callback URL.')
  process.exit(1)
}

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
  console.error('Token exchange failed:', data.error || response.status, data.error_description || '')
  process.exit(1)
}

upsertEnvValue('.env.mcp.local', 'MICROSOFT_ADS_ACCESS_TOKEN', data.access_token)
upsertEnvValue('.env.mcp.local', 'MICROSOFT_ADS_REFRESH_TOKEN', data.refresh_token)

console.log('Token exchange OK')
console.log(`scope: ${data.scope}`)
console.log(`expires_in: ${data.expires_in}s`)
console.log('Updated .env.mcp.local (ACCESS_TOKEN + REFRESH_TOKEN)')
console.log('Next: npm run microsoft-ads:fetch-uet-auth-key')
