import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import {
  SCHEDULED_CRONS,
  UNSCHEDULED_CRON_ROUTES
} from './cronRegistry'

const CRON_ROUTES_DIR = join(
  import.meta.dirname,
  '..',
  'src',
  'app',
  'api',
  'cron'
)

function listCronRoutePaths(): string[] {
  return readdirSync(CRON_ROUTES_DIR)
    .filter(entry => {
      try {
        return statSync(join(CRON_ROUTES_DIR, entry)).isDirectory()
      } catch {
        return false
      }
    })
    .filter(entry => {
      try {
        return statSync(join(CRON_ROUTES_DIR, entry, 'route.ts')).isFile()
      } catch {
        return false
      }
    })
    .map(entry => `/api/cron/${entry}`)
    .sort()
}

test('every cron route is registered (scheduled or documented)', () => {
  const registered = new Set([
    ...SCHEDULED_CRONS.map(entry => entry.path),
    ...UNSCHEDULED_CRON_ROUTES.map(entry => entry.path)
  ])
  const missing = listCronRoutePaths().filter(
    path => !registered.has(path)
  )
  assert.deepEqual(
    missing,
    [],
    `Unregistered cron routes: ${missing.join(', ')}`
  )
})

test('every scheduled cron has a route file', () => {
  const routePaths = new Set(listCronRoutePaths())
  const orphaned = SCHEDULED_CRONS.map(entry => entry.path).filter(
    path => !routePaths.has(path)
  )
  assert.deepEqual(
    orphaned,
    [],
    `Scheduled crons without a route file: ${orphaned.join(', ')}`
  )
})

test('unscheduled routes document their reason', () => {
  for (const entry of UNSCHEDULED_CRON_ROUTES) {
    assert.ok(
      entry.reason.trim().length > 0,
      `${entry.path} must document why it has no schedule`
    )
  }
})

test('no duplicate cron paths', () => {
  const paths = [
    ...SCHEDULED_CRONS.map(entry => entry.path),
    ...UNSCHEDULED_CRON_ROUTES.map(entry => entry.path)
  ]
  assert.equal(new Set(paths).size, paths.length)
})
