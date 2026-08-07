import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const migrationUrl = new URL(
  './20260807124034_enqueue_dun_waitlist_shopify_pgmq_shadow.sql',
  import.meta.url
)
const declarativeMarketingUrl = new URL(
  '../schemas/20_marketing.sql',
  import.meta.url
)
const srcRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src'
)

const runtimePgmqCallPattern =
  /\bpgmq\.(?:read|send|pop|delete|archive|set_vt)\b/

function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
}

async function collectSourceFiles(
  directory: string
): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true
  })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)))
      continue
    }

    if (
      entry.isFile() &&
      /\.(?:ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      files.push(absolutePath)
    }
  }

  return files
}

test('requires STEG 1 durable queue before creating the shadow enqueue trigger', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const executableSql = stripSqlComments(sql)

  assert.match(
    sql,
    /STEG 1 prerequisite missing: durable queue shopify_dun_waitlist_sync/i
  )
  assert.match(
    sql,
    /from pgmq\.list_queues\(\)[\s\S]*queue_name = 'shopify_dun_waitlist_sync'/i
  )
  assert.doesNotMatch(executableSql, /\bpgmq\.create\b/i)
  assert.doesNotMatch(executableSql, /\bpgmq\.create_unlogged\b/i)
  assert.doesNotMatch(executableSql, /\bpgmq_public\b/i)
  assert.doesNotMatch(
    executableSql,
    /grant\b[\s\S]*\b(?:anon|authenticated)\b/i
  )
})

test('creates a SECURITY DEFINER AFTER INSERT trigger that sends minimal PGMQ payloads', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const executableSql = stripSqlComments(sql)

  assert.match(
    sql,
    /create or replace function marketing\.enqueue_shopify_dun_waitlist_sync_on_lead_insert\(\)/i
  )
  assert.match(sql, /security definer/i)
  assert.match(sql, /set search_path = ''/i)
  assert.match(
    sql,
    /new\.source = 'product_waitlist_utekos_dun'/i
  )
  assert.match(sql, /new\.email is not null/i)
  assert.match(sql, /btrim\(new\.email\) <> ''/i)
  assert.match(
    executableSql,
    /perform pgmq\.send\(\s*'shopify_dun_waitlist_sync',\s*jsonb_build_object\(\s*'schema_version',\s*1,\s*'lead_id',\s*new\.id\s*\)/i
  )
  assert.doesNotMatch(executableSql, /exception when others/i)
  assert.match(
    sql,
    /create trigger enqueue_shopify_dun_waitlist_sync_after_insert/i
  )
  assert.match(
    sql,
    /after insert on marketing\.leads/i
  )
  assert.doesNotMatch(executableSql, /after update on marketing\.leads/i)
  assert.match(
    sql,
    /revoke execute on function marketing\.enqueue_shopify_dun_waitlist_sync_on_lead_insert\(\)[\s\S]*from public, anon, authenticated/i
  )
})

test('keeps declarative marketing schema in sync with the shadow enqueue trigger', async () => {
  const sql = await readFile(declarativeMarketingUrl, 'utf8')

  assert.match(
    sql,
    /create or replace function marketing\.enqueue_shopify_dun_waitlist_sync_on_lead_insert\(\)/i
  )
  assert.match(
    sql,
    /create trigger enqueue_shopify_dun_waitlist_sync_after_insert/i
  )
  assert.match(sql, /perform pgmq\.send\(/i)
})

test('does not introduce PGMQ runtime consumer or publisher calls in src/', async () => {
  const sourceFiles = await collectSourceFiles(srcRoot)
  const offenders: string[] = []

  for (const filePath of sourceFiles) {
    const contents = await readFile(filePath, 'utf8')

    if (runtimePgmqCallPattern.test(contents)) {
      offenders.push(path.relative(srcRoot, filePath))
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Unexpected PGMQ runtime calls in src/: ${offenders.join(', ')}`
  )
})
