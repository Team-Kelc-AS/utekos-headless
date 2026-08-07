import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const migrationUrl = new URL(
  './20260807090113_enable_pgmq_shopify_dun_waitlist_sync.sql',
  import.meta.url
)
const declarativeExtensionsUrl = new URL(
  '../schemas/00_extensions.sql',
  import.meta.url
)
const srcRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src'
)

const runtimePgmqCallPattern =
  /\bpgmq\.(?:read|send|delete|archive|set_vt)\b/

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

test('enables pgmq and creates a durable shopify_dun_waitlist_sync queue', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const executableSql = stripSqlComments(sql)

  assert.match(sql, /create extension if not exists pgmq/i)
  assert.match(
    sql,
    /from pgmq\.list_queues\(\)[\s\S]*queue_name = 'shopify_dun_waitlist_sync'/i
  )
  assert.match(
    sql,
    /perform pgmq\.create\('shopify_dun_waitlist_sync'\)/i
  )
  assert.doesNotMatch(executableSql, /\bpgmq\.create_unlogged\b/i)
  assert.doesNotMatch(executableSql, /\bpgmq_public\b/i)
  assert.doesNotMatch(
    executableSql,
    /grant\b[\s\S]*\b(?:anon|authenticated)\b/i
  )
})

test('keeps declarative extensions in sync with pgmq enablement', async () => {
  const sql = await readFile(declarativeExtensionsUrl, 'utf8')

  assert.match(sql, /create extension if not exists pgmq/i)
})

test('does not cut over src runtime to PGMQ send/read/delete/archive/set_vt', async () => {
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
