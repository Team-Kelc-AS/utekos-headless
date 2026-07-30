#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    return {}
  }

  const values = {}

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!match) {
      continue
    }

    const [, key, rawValue] = match
    values[key] = rawValue.replace(/^"|"$/g, '')
  }

  return values
}

const deployHookUrl =
  process.env.VERCEL_DEPLOY_HOOK_URL ??
  readEnvLocal().VERCEL_DEPLOY_HOOK_URL

if (!deployHookUrl) {
  console.warn(
    'VERCEL_DEPLOY_HOOK_URL is not set. Skipping Vercel deploy trigger.'
  )
  process.exit(0)
}

const response = await fetch(deployHookUrl, { method: 'POST' })

if (!response.ok) {
  console.error(
    `Vercel deploy hook failed: ${response.status} ${response.statusText}`
  )
  process.exit(1)
}

const payload = await response.text().catch(() => '')

console.log(
  payload ?
    `Triggered Vercel deploy hook: ${payload}`
  : 'Triggered Vercel deploy hook.'
)
