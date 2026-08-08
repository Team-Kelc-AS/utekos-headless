import fs from 'node:fs'
import path from 'node:path'

import postgres from 'postgres'

import { MICROSOFT_ADS_REPO_ROOT } from '../lib/config.mjs'
import { summarizeMicrosoftUetDispatchAttempts } from './summarize-microsoft-uet-dispatch-attempts.mjs'

const DEFAULT_LOOKBACK_DAYS = 30
const MAX_ROWS = 5000

const WAREHOUSE_URL_ENV_KEYS = Object.freeze([
  'SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING',
  'SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING_MAYBE',
  'SUPABASE_VERCEL_POSTGRES_URL'
])

export async function readMicrosoftUetDispatchEvidence({
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  now = () => new Date(),
  processEnv = process.env,
  repoRoot = MICROSOFT_ADS_REPO_ROOT,
  envFiles = ['.env.mcp.local', '.env.local'],
  createSqlImpl = postgres
} = {}) {
  if (!Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 365) {
    throw new TypeError('Microsoft UET dispatch evidence lookbackDays must be an integer between 1 and 365.')
  }

  const clock = now()
  if (!(clock instanceof Date) || Number.isNaN(clock.getTime())) {
    throw new TypeError('Microsoft UET dispatch evidence clock must return a valid Date.')
  }

  const env = resolveEnv({ processEnv, repoRoot, envFiles })
  const warehouseUrl = firstNonEmpty(env, WAREHOUSE_URL_ENV_KEYS)

  if (!warehouseUrl) {
    return unavailableEvidence('supabase_warehouse_url_unavailable', lookbackDays)
  }

  const since = new Date(clock.getTime() - lookbackDays * 86_400_000).toISOString()
  const sql = createSqlImpl(warehouseUrl, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false,
    connection: {
      application_name: 'utekos-microsoft-ads-mcp-evidence'
    }
  })

  try {
    const rows = await sql`
      select
        event_name,
        status,
        dispatch_mode,
        skip_reason,
        created_at,
        processed_at,
        http_status,
        response_semantics,
        attempt_count
      from ops.provider_dispatch_attempts
      where provider = 'microsoft_uet'
        and created_at >= ${since}
      order by created_at desc
      limit ${MAX_ROWS}
    `

    return summarizeMicrosoftUetDispatchAttempts(Array.isArray(rows) ? rows : [], {
      lookbackDays
    })
  } catch (error) {
    return unavailableEvidence(
      `supabase_read_failed:${sanitizeReason(error?.message)}`,
      lookbackDays
    )
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {})
  }
}

function unavailableEvidence(reason, lookbackDays) {
  return {
    ok: false,
    reason,
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
    bySkipReasonAndEventName: {},
    byEventName: {}
  }
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
