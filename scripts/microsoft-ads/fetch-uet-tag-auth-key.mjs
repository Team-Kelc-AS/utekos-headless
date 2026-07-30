#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const campaignApiBase = 'https://campaign.api.bingads.microsoft.com/CampaignManagement/v13'
const tokenEnvKey = 'MICROSOFT_UET_CAPI_ACCESS_TOKEN'

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
  const next = lines.map(line => {
    if (line.startsWith(prefix)) {
      replaced = true
      return `${key}=${value}`
    }
    return line
  })
  if (!replaced) next.push(`${key}=${value}`)
  fs.writeFileSync(fullPath, `${next.join('\n').replace(/\n?$/, '\n')}`)
}

function getConfig() {
  return {
    developerToken: envValue('MICROSOFT_ADS_DEVELOPER_TOKEN'),
    clientId: envValue('MICROSOFT_ADS_CLIENT_ID'),
    clientSecret: envValue('MICROSOFT_ADS_CLIENT_SECRET'),
    refreshToken: envValue('MICROSOFT_ADS_REFRESH_TOKEN'),
    customerId: envValue('MICROSOFT_ADS_CUSTOMER_ID').replaceAll('-', ''),
    accountId: envValue('MICROSOFT_ADS_ACCOUNT_ID').replaceAll('-', ''),
    uetTagId: envValue('MICROSOFT_UET_TAG_ID') || envValue('NEXT_PUBLIC_MICROSOFT_UET_TAG_ID') || '97247724'
  }
}

function getMissingRequirements(config) {
  const missing = []
  if (!config.developerToken) missing.push('MICROSOFT_ADS_DEVELOPER_TOKEN')
  if (!config.clientId) missing.push('MICROSOFT_ADS_CLIENT_ID')
  if (!config.clientSecret) missing.push('MICROSOFT_ADS_CLIENT_SECRET')
  if (!config.refreshToken) missing.push('MICROSOFT_ADS_REFRESH_TOKEN')
  if (!config.customerId) missing.push('MICROSOFT_ADS_CUSTOMER_ID')
  if (!config.accountId) missing.push('MICROSOFT_ADS_ACCOUNT_ID')
  if (!config.uetTagId) missing.push('MICROSOFT_UET_TAG_ID')
  return missing
}

async function refreshAccessToken(config) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://ads.microsoft.com/msads.manage offline_access'
    })
  })

  const data = await response.json()
  if (!response.ok || typeof data.access_token !== 'string') {
    throw new Error(data.error_description || data.error || `OAuth refresh failed with HTTP ${response.status}`)
  }

  upsertEnvValue('.env.mcp.local', 'MICROSOFT_ADS_ACCESS_TOKEN', data.access_token)
  if (typeof data.refresh_token === 'string') {
    upsertEnvValue('.env.mcp.local', 'MICROSOFT_ADS_REFRESH_TOKEN', data.refresh_token)
  }

  return data.access_token
}

async function fetchUetTagAuthKey(config, accessToken) {
  const response = await fetch(`${campaignApiBase}/UetTagAuthKey/Query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      DeveloperToken: config.developerToken,
      CustomerId: config.customerId,
      CustomerAccountId: config.accountId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      UetTagId: Number(config.uetTagId)
    })
  })

  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text.slice(0, 500) }
  }

  if (!response.ok) {
    throw new Error(`GetUetTagAuthKey failed with HTTP ${response.status}: ${JSON.stringify(data)}`)
  }

  const authKey = data.UetTagAuthKey
  if (typeof authKey !== 'string' || authKey.trim() === '') {
    throw new Error(`GetUetTagAuthKey returned no UetTagAuthKey: ${JSON.stringify(data)}`)
  }

  return authKey.trim()
}

async function main() {
  const config = getConfig()
  const missing = getMissingRequirements(config)

  if (missing.length > 0) {
    console.error('Missing Microsoft Ads OAuth prerequisites:', missing.join(', '))
    process.exit(1)
  }

  const accessToken = await refreshAccessToken(config)
  const authKey = await fetchUetTagAuthKey(config, accessToken)

  upsertEnvValue('.env.local', tokenEnvKey, authKey)
  upsertEnvValue('.env.mcp.local', tokenEnvKey, authKey)

  console.log(JSON.stringify({
    ok: true,
    uetTagId: config.uetTagId,
    tokenEnvKey,
    tokenLength: authKey.length,
    updatedFiles: ['.env.local', '.env.mcp.local'],
    api: 'CampaignManagement/v13/UetTagAuthKey/Query'
  }, null, 2))
  console.log('Next: copy the same env key to Vercel Production, redeploy, then verify purchase dispatch.')
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
