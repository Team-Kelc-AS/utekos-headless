import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

import { MICROSOFT_ADS_REPO_ROOT } from '../lib/config.mjs'
import { summarizeMicrosoftUetDispatchAttempts } from './summarize-microsoft-uet-dispatch-attempts.mjs'

const DEFAULT_LOOKBACK_DAYS = 30
const MAX_ROWS = 5000

export async function readMicrosoftUetDispatchEvidence({
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  now = () => new Date(),
  processEnv = process.env,
  repoRoot = MICROSOFT_ADS_REPO_ROOT,
  envFiles = ['.env.mcp.local', '.env.local'],
  createClientImpl = createClient
} = {}) {
  if (!Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 365) {
    throw new TypeError('Microsoft UET dispatch evidence lookbackDays must be an integer between 1 and 365.')
  }

  const clock = now()
  if (!(clock instanceof Date) || Number.isNaN(clock.getTime())) {
    throw new TypeError('Microsoft UET dispatch evidence clock must return a valid Date.')
  }

  const env = resolveEnv({ processEnv, repoRoot, envFiles })
  const url = firstNonEmpty(env, ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'])
  const serviceRoleKey = firstNonEmpty(env, [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SECRET_KEY'
  ])

  if (!url || !serviceRoleKey) {
    return {
      ok: false,
      reason: 'supabase_server_credentials_unavailable',
      lookbackDays,
      provider: 'microsoft_uet',
      rowCount: 0,
      providerConfirmed: false,
      firstSeenAt: null,
      lastSeenAt: null,
      acceptedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      byStatus: {},
      byDispatchMode: {},
      bySkipReason: {},
      bySkipReasonLastSeenAt: {},
      byEventName: {}
    }
  }

  const supabase = createClientImpl(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-utekos-evidence-reader': 'microsoft-ads-mcp' } }
  })
  const since = new Date(clock.getTime() - lookbackDays * 86_400_000).toISOString()
  const { data, error } = await supabase
    .schema('ops')
    .from('provider_dispatch_attempts')
    .select('event_name,status,dispatch_mode,skip_reason,created_at,processed_at,http_status,response_semantics,attempt_count')
    .eq('provider', 'microsoft_uet')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS)

  if (error) {
    return {
      ok: false,
      reason: `supabase_read_failed:${sanitizeReason(error.message)}`,
      lookbackDays,
      provider: 'microsoft_uet',
      rowCount: 0,
      providerConfirmed: false,
      firstSeenAt: null,
      lastSeenAt: null,
      acceptedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      byStatus: {},
      byDispatchMode: {},
      bySkipReason: {},
      bySkipReasonLastSeenAt: {},
      byEventName: {}
    }
  }

  return summarizeMicrosoftUetDispatchAttempts(Array.isArray(data) ? data : [], {
    lookbackDays
  })
}

function resolveEnv({ processEnv, repoRoot, envFiles }) {
  const fileValues = Object.assign({}, ...envFiles.map(file => readEnvFile(path.resolve(repoRoot, file))))
  return { ...fileValues, ...processEnv }
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        const raw = line.slice(index + 1).trim()
        return [key, stripQuotes(raw)]
      })
  )
}

function stripQuotes(value) {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1)
  }
  return value
}

function firstNonEmpty(values, keys) {
  for (const key of keys) {
    const value = values?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function sanitizeReason(value) {
  return String(value ?? 'unknown').replace(/[\r\n]+/g, ' ').slice(0, 300)
}
